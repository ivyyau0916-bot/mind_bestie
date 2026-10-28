# Supabase Edge Functions

## `stripe-cancel-renewal`

In-app「取消自動續訂」：將 Stripe 訂閱設為 `cancel_at_period_end: true`（本期結束前仍為 VIP）。

### 部署步驟

1. 安裝 [Supabase CLI](https://supabase.com/docs/guides/cli) 並 `supabase login`。
2. 連結專案：`supabase link --project-ref YOUR_PROJECT_REF`
3. 設定 Stripe 密鑰（勿放進前端 `.env`）：

   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxx
   ```

4. 部署：

   ```bash
   supabase functions deploy stripe-cancel-renewal
   ```

5. 在 App 內登入後，偏好設定 → **取消自動續訂（本期結束後）** 即可測試。

若未部署，App 會提示改用 **管理 VIP 訂閱**（已自動帶入登入 Email 的 Stripe 管理頁）。
