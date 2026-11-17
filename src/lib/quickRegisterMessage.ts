export type WelcomeHonorific = "auto" | "Bey" | "Hanım";

const maleNames = new Set("ahmet mehmet mesut mustafa ali hüseyin hasan ibrahim ismail osman ömer yusuf murat emre erkek erkan serkan hakan burak onur oğuz kaan kürşat fatih furkan enes salih recep ramazan abdullah abdurrahman adem adnan arda barış berk berkay buğra caner cihan doğukan engin eren ertugrul ertuğrul faruk gökhan halil harun ilker kemal kerem mahmut mert metin musa necati nihat oktay orhan özgür samet selim sinan süleyman tuncay uğur umut volkan yakup yunus zafer zekeriya".split(" "));
const femaleNames = new Set("elif yasemin ayşe fatma zeynep emine hatice kübra esra merve seda selin melis ezgi ece ebru burcu büşra dilara duygu gamze gül gülay gülcan gülşah hilal hümeyra irem leyla melek melike mine meryem nazlı neslihan nur nuray nurgül özge pelin rabia selen sema sevim sude şevval şeyma tuğba zehra aysel aylin ayla beyza canan cansu ceren derya dilek feyza filiz funda gizem gonca hande hülya neşe nihal nisa pınar sultan sümeyye yağmur aslı sibel sevgi sevda suzan tuğçe beren başak deniz".split(" "));
// Unisex names are intentionally neutral until staff selects an honorific.
const ambiguousNames = new Set("deniz derya evren özgür umut ege doğa öykü bilge duru can yüksel şenel ilke olcay".split(" "));

export function welcomeFirstName(name: string): string {
  return name.trim().replace(/^(?:(?:dr|prof|doç|uzm|psk|dt|dyt)\.?\s+)+/iu, "").split(/\s+/)[0] || "";
}

export function inferWelcomeHonorific(name: string): "Bey" | "Hanım" | "" {
  const firstName = welcomeFirstName(name).toLocaleLowerCase("tr-TR");
  if (ambiguousNames.has(firstName)) return "";
  if (maleNames.has(firstName)) return "Bey";
  if (femaleNames.has(firstName)) return "Hanım";
  return "";
}

export function welcomeAddressee(name: string, selection: WelcomeHonorific = "auto"): string {
  const honorific = selection === "auto" ? inferWelcomeHonorific(name) : selection;
  return [welcomeFirstName(name), honorific].filter(Boolean).join(" ");
}

export const QUICK_REGISTER_APP_MESSAGE = `🎉 Doktorum Ol mobil uygulaması artık App Store ve Play Store'da!

Randevularınızı yönetin, danışanlarınızla iletişimde kalın, takviminizi cebinizden kontrol edin.

📲 Apple Store : https://apps.apple.com/tr/app/doktorum-ol/id6762599027?l=tr

Play Store : https://play.google.com/store/apps/details?id=app.lovable.doktorumol`;