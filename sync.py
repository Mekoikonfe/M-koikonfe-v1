"""Connecteurs autorisés, normalisation et publication atomique. Python 3.9+."""
import argparse, datetime as dt, hashlib, json, os, pathlib, re, time, unicodedata, urllib.request, urllib.parse
from zoneinfo import ZoneInfo
ROOT = pathlib.Path(__file__).resolve().parents[1]
PARIS = 'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records'
UTC = dt.timezone.utc

def get(url, headers=None):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'Mekoikonfe-MVP/1.0', **(headers or {})}), timeout=30) as r:
                return json.load(r)
        except Exception:
            if attempt == 2: raise
            time.sleep(2 ** attempt)

def paris_records():
    metadata=get(PARIS.rsplit('/records',1)[0])
    if 'odbl' not in metadata.get('metas',{}).get('default',{}).get('license','').lower():
        raise ValueError('Licence Paris modifiée : revue nécessaire')
    rows=[]
    for offset in range(0,10000,100):
        page=get(PARIS+'?'+urllib.parse.urlencode({'where':'date_end >= now()', 'order_by':'id', 'limit':100,'offset':offset}))
        rows.extend(page['results'])
        if len(rows)>=page['total_count']: return rows
        time.sleep(.15)
    raise ValueError('Pagination incomplète : publication refusée')

def openagenda_uids():
    raw=os.environ.get('OPENAGENDA_UIDS') or os.environ.get('OPENAGENDA_UID') or ''
    return [int(x) for x in re.split(r'[\s,;]+',raw) if x.strip().isdigit()]

def openagenda_records():
    # Clé côté serveur uniquement ; les agendas sont choisis explicitement (OPENAGENDA_UIDS=uid1,uid2…).
    key=os.environ.get('OPENAGENDA_KEY'); uids=openagenda_uids()
    if not uids or not key: return []
    rows=[]
    for agenda in uids:
        after=None
        for _ in range(100):
            query={'size':100,'relative[]':['current','upcoming']}
            if after: query['after']=json.dumps(after)
            page=get('https://api.openagenda.com/v2/agendas/'+str(agenda)+'/events?'+urllib.parse.urlencode(query,doseq=True), {'key':key})
            rows.extend(page.get('events',[]))
            after=page.get('after')
            if not after: break
            time.sleep(.2)
        else:
            raise ValueError('OpenAgenda : pagination incomplète')
    return rows

TM='https://app.ticketmaster.com/discovery/v2/events.json'
TM_LICENCE={'name':'Ticketmaster Discovery API — conditions d’utilisation','url':'https://developer.ticketmaster.com/support/terms-of-use/','publisher':'Ticketmaster'}

def ticketmaster_records(now=None):
    # Clé côté serveur uniquement (TICKETMASTER_KEY). Paris et 40 km autour, 42 jours, par fenêtres de 7 jours
    # pour rester sous la limite de pagination profonde de l'API (1 000 résultats par requête).
    key=os.environ.get('TICKETMASTER_KEY')
    if not key: return []
    now=now or dt.datetime.now(UTC); rows=[]
    for w in range(6):
        a=now+dt.timedelta(days=7*w); b=a+dt.timedelta(days=7)
        for page in range(5):
            q={'apikey':key,'latlong':'48.8566,2.3522','radius':40,'unit':'km','countryCode':'FR','locale':'fr-fr','size':200,'page':page,'sort':'date,asc',
               'startDateTime':a.strftime('%Y-%m-%dT%H:%M:%SZ'),'endDateTime':b.strftime('%Y-%m-%dT%H:%M:%SZ')}
            data=get(TM+'?'+urllib.parse.urlencode(q))
            rows.extend((data.get('_embedded') or {}).get('events',[]))
            info=data.get('page') or {}
            if page+1>=int(info.get('totalPages') or 0): break
            time.sleep(.25)
        time.sleep(.25)
    return group_ticketmaster(rows)

def tm_category(e):
    c=(e.get('classifications') or [{}])[0]; seg=fold((c.get('segment') or {}).get('name','')); gen=fold((c.get('genre') or {}).get('name','')); sub=fold((c.get('subGenre') or {}).get('name',''))
    txt=gen+' '+sub
    if 'sport' in seg: return None
    if 'family' in txt or 'children' in txt or 'jeune' in txt: return 'jeune'
    if 'comedy' in txt or 'humour' in txt: return 'humour'
    if 'musical' in txt: return 'musical'
    if 'opera' in txt or 'classical' in txt or 'classique' in txt: return 'opera'
    if 'dance' in txt or 'ballet' in txt or 'danse' in txt: return 'danse'
    if 'circus' in txt or 'magic' in txt or 'cirque' in txt: return 'cirque'
    if 'theatre' in txt or 'theater' in txt or 'spectacle' in txt: return 'theatre'
    if 'music' in seg or 'musique' in seg: return 'concert'
    if 'arts' in seg: return 'theatre'
    return None

def group_ticketmaster(rows):
    # Une ligne par date chez Ticketmaster : regroupement par titre + salle pour obtenir un spectacle à plusieurs séances.
    groups={}
    for e in rows:
        v=((e.get('_embedded') or {}).get('venues') or [{}])[0]
        k=(fold(e.get('name','')),v.get('id') or fold(v.get('name','')))
        g=groups.setdefault(k,{'tm':e,'venue':v,'dates':[]})
        d=(e.get('dates') or {}).get('start') or {}
        g['dates'].append({'dateTime':d.get('dateTime'),'localDate':d.get('localDate'),'localTime':d.get('localTime'),'url':e.get('url')})
    return list(groups.values())

def tm_start(d):
    if d.get('dateTime'): return stamp(d['dateTime'])
    if d.get('localDate') and d.get('localTime'):
        return dt.datetime.fromisoformat(d['localDate']+'T'+d['localTime']).replace(tzinfo=ZoneInfo('Europe/Paris'))
    raise ValueError('Horaire absent')

def stamp(s):
    d=dt.datetime.fromisoformat(s.replace('Z','+00:00'))
    if d.tzinfo is None: raise ValueError('Fuseau manquant')
    return d

def clean(s): return re.sub('<[^>]*>', ' ', str(s or '')).strip()
def url(s):
    return s if isinstance(s,str) and urllib.parse.urlparse(s).scheme in ('https','http') else ''
def fold(s): return ''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if not unicodedata.combining(c))
def category(tags):
    t=fold(tags)
    for word,cat in [('cinema','cinema'),('theatre','theatre'),('concert','concert'),('musique','concert'),('expo','expo'),('musee','expo'),('danse','danse'),('cirque','cirque'),('festival','festival'),('humour','humour'),('spectacle musical','musical')]:
        if word in t: return cat
    return None

def normalize(r, source, now):
    if source=='ticketmaster':
        e=r['tm']; v=r['venue']; cat=tm_category(e)
        title=e.get('name'); venue=v.get('name'); city=(v.get('city') or {}).get('name'); address=(v.get('address') or {}).get('line1')
        loc=v.get('location') or {}; geo={'lon':float(loc['longitude']),'lat':float(loc['latitude'])} if loc.get('latitude') and loc.get('longitude') else None
        link=e.get('url'); rid=e.get('id'); updated=None; licence=TM_LICENCE
        pr=e.get('priceRanges') or []
        price=('À partir de %s %s'%(min(p.get('min',0) for p in pr), pr[0].get('currency','EUR'))) if pr and all('min' in p for p in pr) else 'Voir la page Ticketmaster'
        description=e.get('info') or e.get('pleaseNote') or ''
        pairs=[]
        for d in r['dates']:
            try:
                st=tm_start(d); pairs.append((st.isoformat(),(st+dt.timedelta(hours=2)).isoformat()))
            except (ValueError,TypeError): pass
    elif source=='paris':
        tags=r.get('qfap_tags') or ''
        cat=category(tags)
        if 'Ecrans' in tags and re.search(r'cine|projection|film|documentaire|court[s]? metrage',fold((r.get('title') or '')+' '+(r.get('lead_text') or ''))): cat='cinema'
        pairs=[x.split('_') for x in (r.get('occurrences') or '').split(';') if '_' in x]
        title=r.get('title'); venue=r.get('address_name'); city=r.get('address_city')
        link=r.get('url'); updated=r.get('updated_at'); rid=r.get('id')
        licence={'name':'ODbL 1.0','url':'https://opendatacommons.org/licenses/odbl/1-0/','publisher':'Ville de Paris — Que Faire à Paris'}
        price=r.get('price_detail') or r.get('price_type') or 'Non renseigné'
        description=r.get('lead_text'); address=r.get('address_street'); geo=r.get('lat_lon')
    else:
        rights=r.get('rights') or {}; lic=rights.get('license') or {}
        if lic.get('id') not in ('etalab-2.0','cc-by-4.0'): return None
        cat=category(' '.join((r.get('keywords') or {}).get('fr',[])))
        title=(r.get('title') or {}).get('fr'); loc=r.get('location') or {}
        venue=loc.get('name'); city=loc.get('city'); address=loc.get('address');geo=None
        pairs=[(t['begin'],t['end']) for t in r.get('timings',[])];link=r.get('canonicalUrl');rid=r.get('uid');updated=r.get('updatedAt')
        licence={'name':lic.get('name'),'url':url(lic.get('url')),'publisher':(rights.get('licensor') or {}).get('name')}
        if not licence['publisher']: return None
        description=(r.get('description') or {}).get('fr'); price=(r.get('conditions') or {}).get('fr') or 'Non renseigné'
    if not cat or not title or not rid or not url(link): return None
    sessions=[]; warnings=[]
    for pair in pairs:
        try:
            start,end=map(stamp,pair)
            if end<start: raise ValueError()
            if end<now or start>now+dt.timedelta(days=42): continue
            # Une période de plusieurs jours n'est jamais une séance inventée.
            if end-start>dt.timedelta(hours=18): warnings.append('Période continue : horaires à consulter sur la source');continue
            sessions.append({'start':start.isoformat(),'end':end.isoformat(),'localDate':start.astimezone(ZoneInfo('Europe/Paris')).date().isoformat(),'localTime':start.astimezone(ZoneInfo('Europe/Paris')).strftime('%H:%M')})
        except (ValueError,TypeError): warnings.append('Occurrence invalide écartée')
    sessions=sorted({s['start']:s for s in sessions}.values(),key=lambda x:x['start'])
    if not sessions: warnings.append('Aucune séance exploitable dans les 42 prochains jours')
    if not venue or not city: warnings.append('Lieu incomplet')
    if not updated: warnings.append('Date de mise à jour source absente')
    return {'key':source+':'+str(rid),'title':clean(title),'category':cat,'description':clean(description),'venue':clean(venue) or 'Lieu à vérifier','city':clean(city),'address':clean(address),'geo':geo,'sessions':sessions,'period':{'start':r.get('date_start'),'end':r.get('date_end')},'priceText':clean(price),'priceVerified':False,'availability':'unknown','source':{'name':source,'id':str(rid),'url':url(link),'updatedAt':updated,'licence':licence},'lastCheckedAt':now.isoformat(),'quality':{'warnings':sorted(set(warnings)),'status':'incomplete' if warnings else 'usable'}}

def deduplicate(events):
    # Fusion seulement si titre, lieu, ville ET ensemble des séances identiques.
    out={}
    for e in events:
        fingerprint=tuple(fold(e[k]) for k in ('title','venue','city'))+(tuple(s['start'] for s in e['sessions']), json.dumps(e['period'],sort_keys=True) if not e['sessions'] else '')
        if fingerprint in out:
            out[fingerprint]['sources'].append(e['source'])
        else:
            e['sources']=[e['source']];out[fingerprint]=e
    return list(out.values())

def publish(path,data):
    tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(data,encoding='utf8');tmp.replace(path)

def sync():
    now=dt.datetime.now(UTC); path=ROOT/'data/catalog.json'
    old=json.loads(path.read_text()) if path.exists() else {'events':[]}
    events=[]; states=[]
    for name, loader in [('paris',paris_records),('openagenda',openagenda_records),('ticketmaster',ticketmaster_records)]:
        if name=='openagenda' and not (openagenda_uids() and os.getenv('OPENAGENDA_KEY')):
            states.append({'name':name,'status':'not_configured'});continue
        if name=='ticketmaster' and not os.getenv('TICKETMASTER_KEY'):
            states.append({'name':name,'status':'not_configured'});continue
        try:
            rows=loader(); normalized=[]; rejected=0
            for r in rows:
                e=normalize(r,name,now)
                if e: normalized.append(e)
                else: rejected+=1
            events.extend(normalized);states.append({'name':name,'status':'ok','checkedAt':now.isoformat(),'received':len(rows),'accepted':len(normalized),'excluded':rejected})
        except Exception as ex:
            events.extend(e for e in old['events'] if e['source']['name']==name)
            states.append({'name':name,'status':'error','message':type(ex).__name__,'attemptedAt':now.isoformat()})
    result={'schemaVersion':1,'generatedAt':now.isoformat(),'sources':states,'events':deduplicate(events)}
    text=json.dumps(result,ensure_ascii=False,indent=2)
    publish(path,text)
    publish(ROOT/'data/catalog.js','window.MEKO_CATALOG='+text.replace('<','\\u003c')+';\n')
    print(json.dumps({'sources':states,'events':len(result['events'])},ensure_ascii=False))
    return all(s['status']!='error' for s in states)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--watch',action='store_true');args=p.parse_args()
    while True:
        ok=sync()
        if not args.watch: raise SystemExit(0 if ok else 1)
        time.sleep(21600)
