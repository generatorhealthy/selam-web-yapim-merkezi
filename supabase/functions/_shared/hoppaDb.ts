import { supabaseDbPort } from "./iyzicoDb.ts";
import type { HoppaDb } from "./hoppaCheckout.ts";
const SESSION_COLS = "id,order_id,conversation_id,iyzico_token,plan_ref,expected_amount,currency,status,subscription_reference_code,created_at";
// deno-lint-ignore no-explicit-any
export function hoppaDbPort(admin: any): HoppaDb {
  return { ...supabaseDbPort(admin), readSessionByConversation: async (ref) => {
    const { data, error } = await admin.from("payment_checkout_sessions").select(SESSION_COLS).eq("conversation_id", ref)
      .like("plan_ref", "hoppa%").maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  } };
}
