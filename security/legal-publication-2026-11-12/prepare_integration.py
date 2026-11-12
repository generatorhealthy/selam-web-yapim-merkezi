"""Write review-only deploy diff to /tmp. Never edits live app routing or publishes."""
from pathlib import Path
import difflib
root=Path(__file__).resolve().parents[2]
def diff(path,new):
 old=(root/path).read_text()
 return ''.join(difflib.unified_diff(old.splitlines(True),new.splitlines(True),fromfile='a/'+path,tofile='b/'+path))
result=[]
app=(root/'src/App.tsx').read_text()
new=app.replace('import ExplicitConsent from "./pages/ExplicitConsent";', 'import ExplicitConsent from "./pages/ExplicitConsent";\nimport LegalPage from "./pages/legal/LegalPage";')
new=new.replace('<Route path="/acik-riza" element={<ExplicitConsent />} />','<Route path="/acik-riza" element={<ExplicitConsent />} />\n              <Route path="/cagri-merkezi-aydinlatma-metni" element={<LegalPage document="call" />} />')
result.append(diff('src/App.tsx',new))
for page,kind in [('DisclosureText','disclosure'),('ExplicitConsent','consent')]:
 result.append(diff('src/pages/'+page+'.tsx',f'import LegalPage from "./legal/LegalPage";\nexport default function {page}() {{ return <LegalPage document="{kind}" />; }}\n'))
footer=(root/'src/components/Footer.tsx').read_text()
footer=footer.replace('to="/disclosure-text"','to="/aydinlatma-metni"')
footer=footer.replace('              Aydınlatma Metni\n            </Link>', '''              Aydınlatma Metni
            </Link>
            <span aria-hidden="true">|</span>
            <Link to="/acik-riza" className="hover:text-primary transition-colors">Açık Rıza Metni</Link>
            <span aria-hidden="true">|</span>
            <Link to="/cagri-merkezi-aydinlatma-metni" className="hover:text-primary transition-colors">Çağrı Merkezi Aydınlatma Metni</Link>''')
result.append(diff('src/components/Footer.tsx',footer))
ht=(root/'public/.htaccess').read_text().replace('|doki-logos)', '|doki-logos|cagri-merkezi-aydinlatma-metni)')
result.append(diff('public/.htaccess',ht))
candidate=(root/'security/legal-publication-2026-11-12/LegalPage.tsx').read_text()
result.append(''.join(difflib.unified_diff([],candidate.splitlines(True),fromfile='/dev/null',tofile='b/src/pages/legal/LegalPage.tsx')))
out=Path('/tmp/kvkk-coordinated/package-A-review.patch');out.parent.mkdir(exist_ok=True)
out.write_text(''.join(result))
print('Package A candidate diff saved under /tmp only; prerender activation remains separately blocked by legal approval.')