import datetime as dt, gzip, os, sys, unittest
from unittest import mock
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ingestion'))
import sync

CSV = ('aw_deep_link,product_name,search_price,merchant_deep_link,Tickets:venue_name,Tickets:min_price\n'
       'https://www.awin1.com/pclick.php?p=1&a=3166405&m=20796,Restons calmes ! | de et avec Alil Vardar,28.0000,https://www.billetreduc.com/spectacle/restons-calme-412570,La Grande Comédie,17.5000\n'
       'https://www.awin1.com/pclick.php?p=2&a=3166405&m=20796,Le Malade imaginaire,22,https://www.billetreduc.com/spectacle/malade-1,Théâtre Hébertot,22\n'
       'https://www.awin1.com/pclick.php?p=3&a=3166405&m=20796,Le Malade imaginaire,19,https://www.billetreduc.com/spectacle/malade-2,Théâtre de la Huchette,19\n'
       'https://www.awin1.com/pclick.php?p=4&a=3166405&m=20796,Hors domaine,10,https://autre-site.example/x,Ailleurs,10\n'
       'https://www.awin1.com/pclick.php?p=5&a=3166405&m=20796,Duo jazz,32,https://www.billetreduc.com/spectacle/duo-5,Le Baiser Salé,2\n')

class Resp:
    def __init__(self, b): self.b = b
    def read(self): return self.b
    def __enter__(self): return self
    def __exit__(self, *a): return False

class AffiliateTest(unittest.TestCase):
    def setUp(self): self.now = dt.datetime(2026, 11, 26, tzinfo=dt.timezone.utc)
    def run_attach(self, events, payload):
        with mock.patch.dict(os.environ, {'AWIN_BILLETREDUC_FEED': 'https://productdata.awin.com/x'}), \
             mock.patch('urllib.request.urlopen', return_value=Resp(payload)):
            return sync.attach_offers(events, self.now)

    def test_title_key(self):
        self.assertEqual(sync.title_key('Restons calmes ! | de et avec Alil Vardar'), 'restons calmes')
        self.assertEqual(sync.title_key('RESTONS CALMES'), 'restons calmes')

    def test_match_gzip_and_price(self):
        ev = [{'title': 'Restons calmes', 'venue': 'La Grande Comédie'}]
        st = self.run_attach(ev, gzip.compress(CSV.encode()))
        self.assertEqual(st[0]['status'], 'ok'); self.assertEqual(st[0]['matched'], 1)
        self.assertEqual(ev[0]['offers']['billetreduc']['price'], 17.5)
        self.assertTrue(ev[0]['offers']['billetreduc']['url'].startswith('https://www.awin1.com/'))

    def test_ambiguous_title_needs_venue(self):
        ev = [{'title': 'Le Malade imaginaire', 'venue': 'Théâtre du Châtelet'}, {'title': 'Le Malade imaginaire', 'venue': 'Théâtre de la Huchette'}]
        self.run_attach(ev, CSV.encode())
        self.assertNotIn('offers', ev[0]); self.assertEqual(ev[1]['offers']['billetreduc']['price'], 19)

    def test_aberrant_low_price_ignored(self):
        ev = [{'title': 'Duo jazz', 'venue': 'Le Baiser Salé'}]
        self.run_attach(ev, CSV.encode()); self.assertEqual(ev[0]['offers']['billetreduc']['price'], 32)

    def test_foreign_links_and_missing_feed(self):
        ev = [{'title': 'Hors domaine', 'venue': 'Ailleurs'}]
        self.run_attach(ev, CSV.encode()); self.assertNotIn('offers', ev)
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertEqual(sync.attach_offers([], self.now)[0]['status'], 'not_configured')

if __name__ == '__main__': unittest.main()
