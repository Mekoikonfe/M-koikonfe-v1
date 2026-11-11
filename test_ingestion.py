import datetime as dt, importlib.util, json, pathlib, tempfile, unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('sync',pathlib.Path(__file__).resolve().parents[1]/'ingestion/sync.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
NOW=dt.datetime(2026,10,25,tzinfo=dt.timezone.utc)
def row(**extra):
    return {'id':'42','title':'Concert réel','qfap_tags':'Concert','url':'https://www.paris.fr/evenements/42','address_name':'Salle','address_city':'Paris','updated_at':'2026-10-24T10:00:00Z','occurrences':'2026-10-25T20:00:00+01:00_2026-10-25T22:00:00+01:00','price_detail':'10 à 30 €',**extra}
class Tests(unittest.TestCase):
    def test_normalize(self):
        e=m.normalize(row(),'paris',NOW)
        self.assertEqual(e['sessions'][0]['localTime'],'20:00');self.assertFalse(e['priceVerified']);self.assertEqual(e['availability'],'unknown')
    def test_dst_and_multiple(self):
        e=m.normalize(row(occurrences='2026-10-25T01:30:00Z_2026-10-25T02:30:00Z;2026-10-25T18:00:00Z_2026-10-25T19:00:00Z'),'paris',NOW)
        self.assertEqual([s['localTime'] for s in e['sessions']],['02:30','19:00'])
    def test_no_invented_session(self):
        e=m.normalize(row(occurrences='2026-10-25T10:00:00Z_2026-11-20T18:00:00Z'),'paris',NOW)
        self.assertEqual(e['sessions'],[]);self.assertEqual(e['quality']['status'],'incomplete')
    def test_bad_dates(self):
        for dates in ['bad_bad','2026-10-25T20:00:00_2026-10-25T22:00:00','2020-01-01T20:00:00Z_2020-01-01T22:00:00Z']:
            self.assertEqual(m.normalize(row(occurrences=dates),'paris',NOW)['sessions'],[])
    def test_url_and_category(self):
        self.assertIsNone(m.normalize(row(url='javascript:alert(1)'),'paris',NOW))
        self.assertIsNone(m.normalize(row(qfap_tags='Sport'),'paris',NOW))
        for tags,cat in [('Cinéma','cinema'),('Musée','expo'),('Théâtre','theatre')]:self.assertEqual(m.category(tags),cat)
    def test_dedup(self):
        a=m.normalize(row(),'paris',NOW);b=m.normalize(row(id='43'),'paris',NOW)
        self.assertEqual(len(m.deduplicate([a,b])),1);self.assertEqual(len(a['sources']),2)
        c=m.normalize(row(address_name='Autre salle'),'paris',NOW);self.assertEqual(len(m.deduplicate([a,c])),2)
    def test_licence_gate(self):
        self.assertIsNone(m.normalize({'rights':{'license':{'id':'private'}}},'openagenda',NOW))
    def test_failure_and_withdrawal(self):
        with tempfile.TemporaryDirectory() as folder:
            root=pathlib.Path(folder);(root/'data').mkdir()
            e=m.normalize(row(),'paris',NOW)
            (root/'data/catalog.json').write_text(json.dumps({'events':[e]}))
            with patch.object(m,'ROOT',root),patch.object(m,'paris_records',side_effect=TimeoutError),patch.dict(m.os.environ,{},clear=True):
                self.assertFalse(m.sync());result=json.loads((root/'data/catalog.json').read_text());self.assertEqual(result['events'][0]['lastCheckedAt'],e['lastCheckedAt']);self.assertEqual(result['sources'][0]['status'],'error')
            with patch.object(m,'ROOT',root),patch.object(m,'paris_records',return_value=[]),patch.dict(m.os.environ,{},clear=True):
                self.assertTrue(m.sync());self.assertEqual(json.loads((root/'data/catalog.json').read_text())['events'],[])
    def test_pagination(self):
        with patch.object(m,'get',side_effect=[{'metas':{'default':{'license':'ODbL'}}},{'results':[row()]*100,'total_count':101},{'results':[row(id='101')],'total_count':101}]),patch.object(m.time,'sleep'):
            self.assertEqual(len(m.paris_records()),101)
if __name__=='__main__':unittest.main()
