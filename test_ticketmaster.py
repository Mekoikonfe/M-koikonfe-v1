import datetime as dt, json, os, sys, pathlib, unittest
from unittest import mock
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'ingestion'))
import sync

def tm(id,name,date,time_,venue='Accor Arena',vid='V1',seg='Music',genre='Rock',url='https://www.ticketmaster.fr/fr/manifestation/x'):
    return {'id':id,'name':name,'url':url,'dates':{'start':{'localDate':date,'localTime':time_,'dateTime':date+'T'+time_+'Z'}},
            'classifications':[{'segment':{'name':seg},'genre':{'name':genre}}],'priceRanges':[{'min':45.5,'max':90,'currency':'EUR'}],
            '_embedded':{'venues':[{'id':vid,'name':venue,'city':{'name':'Paris'},'address':{'line1':'8 Bd de Bercy'},'location':{'latitude':'48.83','longitude':'2.37'}}]}}

class TicketmasterTest(unittest.TestCase):
    now=dt.datetime(2026,11,11,12,tzinfo=dt.timezone.utc)
    def test_grouping_and_normalisation(self):
        g=sync.group_ticketmaster([tm('a','Placebo','2026-11-25','19:00:00'),tm('b','Placebo','2026-11-26','19:00:00'),tm('c','Match PSG','2026-11-20','20:00:00',seg='Sports',genre='Football')])
        self.assertEqual(len(g),2)
        e=sync.normalize(g[0],'ticketmaster',self.now)
        self.assertEqual(e['category'],'concert'); self.assertEqual(len(e['sessions']),2)
        self.assertEqual(e['sessions'][0]['localTime'],'20:00')  # 19:00 UTC = 20:00 à Paris en novembre
        self.assertEqual(e['source']['licence']['publisher'],'Ticketmaster'); self.assertTrue(e['source']['url'].startswith('https://'))
        self.assertIn('45.5',e['priceText'])
        self.assertIsNone(sync.normalize(g[1],'ticketmaster',self.now))  # sport exclu
    def test_categories(self):
        f=lambda seg,genre: sync.tm_category({'classifications':[{'segment':{'name':seg},'genre':{'name':genre}}]})
        self.assertEqual(f('Arts & Theatre','Comedy'),'humour'); self.assertEqual(f('Arts & Theatre','Musical'),'musical')
        self.assertEqual(f('Arts & Theatre','Theatre'),'theatre'); self.assertEqual(f('Music','Classical'),'opera')
        self.assertEqual(f('Arts & Theatre','Children\'s Theatre'),'jeune'); self.assertIsNone(f('Sports','Basketball'))
    def test_not_configured_without_key(self):
        with mock.patch.dict(os.environ,{},clear=True): self.assertEqual(sync.ticketmaster_records(),[])
    def test_paging_windows(self):
        calls=[]
        def fake(u,h=None):
            calls.append(u); return {'_embedded':{'events':[tm(str(len(calls)),'Show','2026-11-20','19:00:00')]},'page':{'totalPages':1}}
        with mock.patch.dict(os.environ,{'TICKETMASTER_KEY':'k'}),mock.patch.object(sync,'get',fake),mock.patch.object(sync.time,'sleep',lambda s:None):
            rows=sync.ticketmaster_records(self.now)
        self.assertEqual(len(calls),6); self.assertEqual(len(rows),1); self.assertEqual(len(rows[0]['dates']),6)
    def test_openagenda_multiple_uids(self):
        with mock.patch.dict(os.environ,{'OPENAGENDA_UIDS':'123, 456;789','OPENAGENDA_KEY':'k'},clear=True): self.assertEqual(sync.openagenda_uids(),[123,456,789])
        with mock.patch.dict(os.environ,{'OPENAGENDA_UID':'42'},clear=True): self.assertEqual(sync.openagenda_uids(),[42])

if __name__=='__main__': unittest.main()
