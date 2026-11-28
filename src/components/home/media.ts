import iconAsset from "@/assets/doktorumol-icon.png.asset.json";
import clientAsset from "@/assets/client-blue.webp.asset.json";
import expertAsset from "@/assets/expert-blue.webp.asset.json";

// Hostinger üzerindeki ana alan adı da aynı kalıcı CDN dosyalarını kullanır.
const CDN_ORIGIN = "https://yenii.lovable.app";
const absoluteAssetUrl = (asset: { url: string }) => new URL(asset.url, CDN_ORIGIN).toString();

export const iconUrl = absoluteAssetUrl(iconAsset);
export const clientUrl = absoluteAssetUrl(clientAsset);
export const expertUrl = absoluteAssetUrl(expertAsset);
