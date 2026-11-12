// REAL staging test skeleton: credentials are supplied outside code; no demo/mock auth.
import {test,expect} from '@playwright/test';
import {assertStaging} from './guard';
test.beforeEach(async({page})=>{
 const url=process.env.STAGING_SUPABASE_URL,ref=process.env.STAGING_PROJECT_REF,origin=process.env.STAGING_APP_ORIGIN;
 if(!url||!ref||!origin)throw new Error('Separate staging connection is required; never use VITE production variables.');
 assertStaging(url,ref);
 const host=new URL(origin).hostname;
 if(host==='doktorumol.com.tr'||host==='yenii.lovable.app'||!process.env.STAGING_ALLOWED_APP_HOST||host!==process.env.STAGING_ALLOWED_APP_HOST)throw new Error('Unapproved app origin');
 await page.goto(origin);
});
test('verified specialist reads synthetic submitted result through panel',async({page})=>{
 const email=process.env.STAGING_SPECIALIST_EMAIL,password=process.env.STAGING_SPECIALIST_PASSWORD;
 if(!email||!password)throw new Error('Synthetic specialist account required');
 await page.getByRole('link',{name:'Giriş Yap',exact:true}).click();
 await page.getByLabel('E-posta',{exact:true}).fill(email);
 await page.getByLabel('Şifre',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Giriş Yap',exact:true}).click();
 await page.getByRole('button',{name:'Test Cevapları',exact:true}).click();
 await expect(page.getByText('Sentetik Test Danışanı',{exact:true})).toBeVisible();
});
// Not executed without staging. Selectors must be reconciled with the approved staging screen.
// Email inbox, Google/Apple PKCE, guest CAPTCHA and mobile device paths are separate acceptance
// scenarios; a successful specialist test alone does not prove them.