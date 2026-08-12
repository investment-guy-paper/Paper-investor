import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen, TrendingUp, Briefcase, Rocket, Calculator, Award,
  Flame, Check, X, Lock, ChevronLeft, ChevronRight, Play, FastForward,
  Newspaper, Coins, AlertTriangle, RotateCcw, Wallet, Target, Eye, BookMarked, Lightbulb
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
/* ============================================================
   GLOSSARY — every term the app uses, in plain language.
   d = definition, f = formula, ex = worked example, w = why it matters
   ============================================================ */
const GLOSSARY = {
  "EPS": { t: "EPS (earnings per share)", d: "The company's profit for the year, divided by the number of shares. It tells you how much profit belongs to one single share.", f: "EPS = net profit ÷ number of shares", ex: "A company earns CHF 500m and has 100m shares. EPS = CHF 5. If you own one share, CHF 5 of profit was earned on your behalf that year.", w: "Almost every valuation shortcut starts here. When EPS grows over years, the share price eventually follows." },
  "P/E": { t: "P/E ratio (price to earnings)", d: "How many years of current profit you are paying for the share. A P/E of 15 means you pay 15 francs for every 1 franc of annual profit.", f: "P/E = share price ÷ EPS", ex: "Price CHF 60, EPS CHF 4 → P/E of 15. Put differently, the business earns back your purchase price in 15 years if nothing changes.", w: "It is the fastest way to compare what the market expects. Low P/E means low expectations, high P/E means the market has already priced in growth." },
  "PEG": { t: "PEG ratio", d: "The P/E adjusted for how fast the company is growing. It lets you compare a fast grower to a slow one fairly.", f: "PEG = P/E ÷ earnings growth rate (in %)", ex: "P/E 18, growing 24% a year → PEG = 0.75.", w: "Lynch's rule of thumb: below 1 is interesting, above 2 means you are paying for growth that has to actually arrive." },
  "book value": { t: "Book value", d: "What the company owns minus what it owes, according to its accounts. Roughly, what would theoretically be left for shareholders if it sold everything and paid off all debts.", f: "Book value = total assets − total liabilities", ex: "Assets CHF 800m, debts CHF 500m → book value CHF 300m.", w: "It is a rough floor for asset-heavy businesses. It is nearly meaningless for software companies, whose real assets are code and people that never appear on the balance sheet." },
  "book value per share": { t: "Book value per share", d: "The book value divided by the number of shares — the accounting value behind one share.", f: "Book value per share = book value ÷ number of shares", ex: "Book value CHF 300m, 15m shares → CHF 20 per share." },
  "P/B": { t: "P/B ratio (price to book)", d: "How much you pay relative to the accounting value of the company's assets.", f: "P/B = share price ÷ book value per share", ex: "Price CHF 30, book value per share CHF 20 → P/B of 1.5.", w: "Below 1 means the market values the company at less than its stated assets — sometimes a bargain, more often a warning that those assets are not worth what the accounts claim." },
  "ROE": { t: "ROE (return on equity)", d: "How much profit the company generates from the shareholders' money it holds. It measures how good the business is at turning capital into profit.", f: "ROE = net profit ÷ shareholders' equity", ex: "Profit CHF 60m on equity of CHF 300m → ROE of 20%.", w: "Buffett looks for ROE consistently above 15% without much debt. High ROE year after year is evidence of a real competitive advantage rather than luck." },
  "moat": { t: "Moat", d: "A durable advantage that stops competitors from stealing a company's profits — a brand people insist on, a network that gets better as it grows, or costs that make switching painful.", ex: "Leaving a bank means moving direct debits, cards and salary payments. That friction is a moat. A steel mill has none: buyers pick whoever is cheapest today.", w: "Without a moat, competition grinds profits down to nothing. It is the single thing that lets a business stay profitable for decades." },
  "margin of safety": { t: "Margin of safety", d: "Buying well below what you think something is worth, so that being wrong still doesn't ruin you.", f: "Margin of safety = (your value estimate − price) ÷ your value estimate", ex: "You think it's worth CHF 100 and pay CHF 62 → a 38% margin of safety. Even if your estimate was 25% too optimistic, you still didn't overpay.", w: "Graham's central idea. It exists precisely because your forecast will sometimes be wrong." },
  "discount to value": { t: "Discount to value", d: "How far below your own estimate of a company's worth you are buying. It is the same idea as margin of safety, expressed as one percentage.", f: "Discount = (your value estimate − price) ÷ your value estimate", ex: "You judge it worth CHF 100 and the price is CHF 62 → (100 − 62) ÷ 100 = 38% discount. Note the upside is larger than the discount: 100 ÷ 62 − 1 = 61% gain if price reaches value.", w: "It is your error budget. A 38% discount means your valuation could be 38% too optimistic and you still haven't overpaid. Demand a bigger discount when your estimate is shakier." },
  "intrinsic value": { t: "Intrinsic value", d: "What a business is genuinely worth based on the cash it will produce over its life — as opposed to what the market happens to be quoting today.", w: "Nobody can calculate it exactly. The point is to arrive at a rough range and then only buy well below it." },
  "DCF": { t: "DCF (discounted cash flow)", d: "A method of valuing a business by estimating the cash it will produce in future years, then reducing those future amounts to what they're worth today.", f: "Value = sum of (future cash flow ÷ (1 + discount rate)^years)", ex: "CHF 100 arriving in 5 years, with a 10% required return, is worth 100 ÷ 1.1⁵ = about CHF 62 today.", w: "It forces you to write down your assumptions. Its weakness is that small changes in those assumptions swing the answer enormously." },
  "discount rate": { t: "Discount rate", d: "The annual return you demand for taking the risk. It converts future money into today's money.", ex: "If you want 10% a year, then CHF 110 next year is worth CHF 100 to you today.", w: "For a private investor the practical version is: 'I want 10% a year — what is the most I can pay?' A higher discount rate means you'll pay less." },
  "WACC": { t: "WACC (weighted average cost of capital)", d: "The blended annual cost of the money a company uses, mixing what it pays lenders and what shareholders expect.", w: "Professionals use it as the discount rate. As a private investor you can skip it and simply use the return you personally require." },
  "terminal value": { t: "Terminal value", d: "In a valuation, the estimated worth of everything beyond the years you actually forecast — usually year 10 onwards.", w: "It often makes up 60–80% of the total answer, and it is the least knowable part. When someone's valuation looks precise, this is usually where the guesswork hides." },
  "free cash flow": { t: "Free cash flow", d: "The cash left over after the company has paid all its running costs and the investment needed to keep operating.", f: "Free cash flow = operating cash flow − capital expenditure", w: "Profit is an accounting opinion; cash is a fact. Dividends and debt repayments come out of cash, not out of reported profit." },
  "owner earnings": { t: "Owner earnings", d: "Buffett's version of true profit: what the owner could actually take out each year without the business shrinking.", f: "Owner earnings = net profit + depreciation − maintenance capex ± working capital change", ex: "Profit 120, depreciation 40, maintenance capex 55, working capital up 10 → 120 + 40 − 55 − 10 = 95.", w: "Reported profit often overstates what you can really pocket, especially in businesses that constantly need new machines." },
  "capex": { t: "Capex (capital expenditure)", d: "Money spent on physical or long-lived things: machines, buildings, vehicles, equipment.", w: "A business needing heavy capex just to stand still keeps very little for its owners. Low-capex businesses compound far faster." },
  "maintenance capex": { t: "Maintenance capex", d: "The portion of capex needed just to keep the business at its current size — replacing worn-out equipment.", w: "This is a real cost of staying in business, so it must be subtracted from profit. Growth capex, which expands the business, is optional and treated separately." },
  "D&A": { t: "D&A (depreciation & amortisation)", d: "An accounting charge that spreads the cost of an asset over the years it is used, rather than all at once.", ex: "A CHF 100,000 machine lasting 10 years shows CHF 10,000 of depreciation each year, even though the cash left the company in year one.", w: "It reduces reported profit without any cash leaving that year, which is why you add it back when calculating owner earnings." },
  "working capital": { t: "Working capital", d: "The cash tied up in day-to-day operations — money sitting in unsold stock and in bills customers haven't paid yet.", w: "Growing companies swallow cash here. If it rises much faster than sales, customers may not be paying, which is a classic warning sign." },
  "net income": { t: "Net income", d: "The official bottom-line profit after every cost, interest and tax. Also called net profit or earnings.", w: "It is the starting point for most calculations, but it can be shaped by accounting choices. Always cross-check it against actual cash." },
  "EBITDA": { t: "EBITDA", d: "Profit before interest, tax, depreciation and amortisation — an approximation of operating profit before financing and accounting effects.", w: "Useful for comparing companies with different debt levels, but it deliberately ignores real costs. Munger called it 'bullshit earnings' for exactly that reason." },
  "net debt": { t: "Net debt", d: "Total borrowings minus the cash the company holds.", f: "Net debt = total debt − cash", ex: "Debt CHF 500m, cash CHF 200m → net debt CHF 300m. A company with more cash than debt has 'net cash', which is a position of strength.", w: "Debt removes your ability to wait. A cheap company with heavy debt can go bankrupt before its value is recognised." },
  "net debt/EBITDA": { t: "Net debt / EBITDA (leverage ratio)", d: "How many years of rough operating profit it would take to repay everything a company owes. The standard test of whether a debt load is dangerous.", f: "Leverage = net debt ÷ EBITDA", ex: "Net debt CHF 400m against EBITDA of CHF 100m → 4×. Four full years of operating profit, spent on nothing else at all, just to clear the borrowings.", w: "Under 2× is comfortable, 3× is stretched, above 4× the lenders effectively control the company. On a business with falling sales it is close to fatal: profits shrink, so the ratio worsens by itself, and the bank can refuse to refinance at the worst moment." },
  "leverage": { t: "Leverage", d: "Using borrowed money to increase the size of a position — whether by a company or by an investor.", w: "It magnifies gains and losses equally, but only losses can force you to sell at the worst possible moment. It is the main reason clever investors go broke." },
  "debt/equity": { t: "Debt-to-equity ratio", d: "How much a company has borrowed compared with the shareholders' money in it.", f: "Debt/equity = total debt ÷ shareholders' equity", ex: "Debt CHF 600m against equity of CHF 300m → 2.0, meaning twice as much borrowed as owned.", w: "Above roughly 1 deserves scrutiny; high ratios can make return on equity look impressive while quietly making the company fragile." },
  "dividend": { t: "Dividend", d: "A cash payment made from the company's profits to shareholders, usually quarterly or annually.", w: "It is not free money — the share price drops by roughly the payment amount. Real income comes from the dividend growing over time." },
  "dividend yield": { t: "Dividend yield", d: "The annual dividend as a percentage of the share price.", f: "Dividend yield = annual dividend per share ÷ share price", ex: "CHF 1.50 dividend on a CHF 50 share → 3%.", w: "A very high yield is usually a warning, not a bargain: the yield rose because the price collapsed, and a cut is often coming." },
  "payout ratio": { t: "Payout ratio", d: "The share of profit that gets paid out as dividends instead of being kept in the business.", f: "Payout ratio = dividends ÷ profit (better: ÷ free cash flow)", ex: "CHF 2 of dividends from CHF 5 of profit → 40%.", w: "Below about 60% is generally safe. Above 100% means the company is paying dividends with borrowed money, and the dividend will eventually be cut." },
  "yield on cost": { t: "Yield on cost", d: "Today's dividend measured against the price you originally paid, not today's price.", ex: "You bought at CHF 50 with a CHF 1.50 dividend (3%). Fifteen years later the dividend is CHF 4.76 — a 9.5% yield on your original CHF 50.", w: "This is the actual mechanism behind long-term passive income. Dividend growth matters far more than the starting yield." },
  "total return": { t: "Total return", d: "Everything you earn from an investment: the price change plus dividends received.", w: "Judging an investment on price alone ignores years of dividends; judging on dividends alone ignores the capital you lost." },
  "CAGR": { t: "CAGR (compound annual growth rate)", d: "The smoothed average yearly rate that turns a starting amount into an ending amount.", f: "CAGR = (end ÷ start)^(1 ÷ years) − 1", ex: "CHF 10,000 becomes CHF 20,000 in 8 years → (2)^(1/8) − 1 = about 9% a year.", w: "It is the only fair way to compare results over different time periods." },
  "compounding": { t: "Compounding", d: "Earning returns on your previous returns, so growth accelerates over time.", ex: "CHF 10,000 at 8%: after year 1 you have CHF 10,800, and year 2 earns 8% on 10,800, not on 10,000. After 30 years it's roughly CHF 100,000.", w: "It is why starting at 18 is worth more than any stock-picking skill you might develop later. Time is the ingredient you can't buy back." },
  "rule of 72": { t: "Rule of 72", d: "A mental shortcut for how long money takes to double.", f: "Years to double ≈ 72 ÷ annual return %", ex: "At 9% a year: 72 ÷ 9 = 8 years to double.", w: "It's the fastest sanity check there is. If someone promises doubling in 2 years, they are implying 36% a year — ask hard questions." },
  "drawdown": { t: "Drawdown", d: "The fall from a peak to the bottom, expressed as a percentage.", ex: "A portfolio falling from CHF 100,000 to CHF 60,000 has a 40% drawdown.", w: "Losses are asymmetric: recovering from −50% requires +100%. Avoiding disaster matters more than catching every gain." },
  "volatility": { t: "Volatility", d: "How much a price jumps around, up and down.", w: "Volatility is not the same as risk. A jumpy share in a debt-free company is far safer than a calm one loaded with borrowings. Marks: risk is losing money permanently, not seeing red numbers temporarily." },
  "risk": { t: "Risk", d: "In value investing, the chance of permanently losing your capital — not the chance of a temporary price fall.", w: "Risk is highest exactly when it feels lowest: after years of gains, when everyone has been rewarded for taking more of it." },
  "diversification": { t: "Diversification", d: "Spreading money across different investments so that one bad outcome can't destroy you.", w: "The cheapest protection available against your own mistakes. The cost is that you'll never own only the best performer." },
  "asset allocation": { t: "Asset allocation", d: "How you split your money between broad categories: shares, bonds, cash, property.", w: "Bernstein's point: this single decision explains more of your 30-year outcome than which individual shares you pick." },
  "rebalancing": { t: "Rebalancing", d: "Periodically returning your portfolio to its target split by selling what has grown and buying what has fallen.", ex: "Target is 80% shares. After a strong year it's 88%, so you sell 8% and move it to the other side.", w: "It's a mechanical way of selling high and buying low, with the decision made in advance — before emotion can interfere." },
  "index fund": { t: "Index fund", d: "A fund that simply owns everything in a market, in proportion, instead of trying to pick winners.", w: "It guarantees you the market's return minus a tiny fee. Most professionals fail to beat it, which makes it the honest benchmark for your own results." },
  "ETF": { t: "ETF (exchange-traded fund)", d: "A fund you buy and sell on the stock exchange exactly like a share. Most index funds you'd buy are ETFs.", w: "Cheap, instantly diversified, and available at every Swiss broker. For most people it's the sensible core of a portfolio." },
  "accumulating": { t: "Accumulating vs distributing fund", d: "An accumulating fund reinvests dividends inside the fund automatically. A distributing fund pays them into your account as cash.", w: "In Switzerland, dividends are taxed as income whether reinvested or not, so accumulating funds don't dodge the tax — but they do compound automatically without you having to act." },
  "TER": { t: "TER (total expense ratio)", d: "The annual fee a fund charges, as a percentage of your money invested.", ex: "A 0.20% TER on CHF 10,000 costs CHF 20 a year. A 1.5% fee costs CHF 150.", w: "Fees compound against you just as returns compound for you. Over 30 years, 1.5% a year can consume roughly a third of your final capital." },
  "stamp duty": { t: "Stamp duty (Umsatzabgabe)", d: "A small Swiss tax charged on securities transactions by Swiss brokers — roughly 0.075% on Swiss and 0.15% on foreign securities.", w: "Small per trade, but it's one more reason frequent trading loses to patience. Verify current rates, as they can change." },
  "withholding tax": { t: "Withholding tax (Verrechnungssteuer)", d: "Tax deducted at source from dividends before the money reaches you. In Switzerland it's 35% on Swiss dividends.", w: "For Swiss residents it's reclaimable through your tax return, provided you declare the holding. Foreign dividends have their own rates set by treaty." },
  "Säule 3a": { t: "Säule 3a (pillar 3a)", d: "Switzerland's tax-privileged private pension account. Contributions are deducted from your taxable income, and the money is locked until near retirement.", w: "Available to you as an apprentice with earned income. A 3a account invested in shares beats a 3a savings account over long horizons. Check the current annual limit — it changes." },
  "capital gains": { t: "Capital gains", d: "The profit made when you sell something for more than you paid.", w: "For private investors in Switzerland these are generally tax-free on securities, while dividends are taxed as income. That asymmetry quietly favours low-yield compounders over high-yield strategies." },
  "professional securities dealer": { t: "Professional securities dealer status", d: "A Swiss tax classification. If your trading looks like a business rather than private investing, the authorities can reclassify you — and your capital gains become taxable.", w: "Factors include how long you hold, how often you trade, whether you use borrowed money, and how much of your income it represents. Another argument for patience. Get proper advice before trading heavily." },
  "cyclical": { t: "Cyclical", d: "A company whose profits rise and fall with the wider economy — carmakers, banks, steel, airlines, chemicals.", w: "The rules invert here: a low P/E usually means profits are at a peak and about to fall, while a scary-looking high P/E can mark the bottom. Misreading this is a common expensive mistake." },
  "stalwart": { t: "Stalwart", d: "Lynch's term for a large, stable company growing perhaps 4–12% a year — think Nestlé or Coca-Cola.", w: "Expect solid gains over years plus dividends, not spectacular ones. These cushion a portfolio during declines." },
  "fast grower": { t: "Fast grower", d: "A smaller, aggressive company growing 20%+ a year.", w: "This is where Lynch found his tenbaggers, and also where the biggest losses happen. Size these positions so a failure doesn't hurt too much." },
  "turnaround": { t: "Turnaround", d: "A damaged company that might recover — if something actually changes.", w: "Hope is not a catalyst. You need new management, a sold-off division, a fixed balance sheet — something concrete." },
  "asset play": { t: "Asset play", d: "A company sitting on something worth more than its share price suggests — land, a stake in another business, cash.", w: "Only works if that hidden value can actually be sold or unlocked. Otherwise it stays hidden forever." },
  "value trap": { t: "Value trap", d: "A share that looks cheap on the numbers but keeps falling, because the underlying business is genuinely dying.", ex: "Newspapers, video rental shops and mall retailers were all statistically cheap the entire way down to zero.", w: "The multiple falls as fast as the profits, so the discount never closes. The test is whether profits have stopped deteriorating — not whether the P/E is low." },
  "tenbagger": { t: "Tenbagger", d: "Lynch's word for an investment that grows to ten times what you paid.", w: "A share can only fall 100% but can rise 1,000%. That asymmetry means a few big winners can carry many losers — provided you let winners run." },
  "diworsification": { t: "Diworsification", d: "Lynch's term for a company buying unrelated businesses with shareholders' money instead of returning it.", ex: "A profitable software company buying a chain of gyms.", w: "It usually signals management has run out of good ideas in its core business and would rather build an empire than pay you." },
  "second-level thinking": { t: "Second-level thinking", d: "Marks's idea: don't just ask whether it's a good company, ask whether the price already assumes it's a good company.", ex: "First level: 'great business, buy it.' Second level: 'great business, but priced for perfection, so the likely return is poor.'", w: "You can't do what everyone else does and expect a different result. The edge lies in the gap between what people believe and what's true." },
  "Mr. Market": { t: "Mr. Market", d: "Graham's parable: imagine a moody business partner who turns up daily offering to buy your stake or sell you his — euphoric some days, terrified on others.", w: "He is there to serve you, not to instruct you. A falling price is his mood changing, which is only your problem if you choose to accept his offer." },
  "Graham number": { t: "Graham number", d: "A maximum price for cautious investors, combining Graham's two limits — never pay more than 15× annual profit, never more than 1.5× book value — into one number. The 22.5 in the formula is simply 15 × 1.5.", f: "Graham number = √(22.5 × EPS × book value per share)", ex: "EPS CHF 3, book value per share CHF 20 → 22.5 × 3 × 20 = 1350 → √1350 ≈ CHF 36.74. At that price the P/E is 12.2 and the P/B is 1.84: cheap earnings paying for dear assets, which is the trade-off the formula allows.", w: "Letting one limit be breached when the other is low avoids rejecting good companies on a technicality. Useful for banks, industrials and property; useless for software and brands, whose real value never appears in book value." },
  "market cap": { t: "Market capitalisation", d: "The total price of the whole company: what you'd pay to buy every share.", f: "Market cap = share price × number of shares", ex: "10m shares at CHF 50 → CHF 500m.", w: "The share price alone is meaningless without this. A CHF 5 share isn't 'cheaper' than a CHF 500 share — it just has more shares outstanding." },
  "buyback": { t: "Share buyback", d: "The company uses its cash to buy its own shares and cancel them, so each remaining share owns a bigger slice.", w: "Excellent when done at low prices, value-destroying when done at high ones. Most companies buy back most heavily at the top." },
  "position sizing": { t: "Position sizing", d: "Deciding how much money goes into a single investment.", w: "Size by conviction and by survivability. If a 60% fall in one holding would end your plan, that holding is too big — no matter how confident you feel." },
  "benchmark": { t: "Benchmark", d: "The standard you measure yourself against — usually a global index fund.", w: "Without one, you can't tell skill from a rising tide. If you can't beat it over many years, the honest answer is to own more of it." },
  "pre-money": { t: "Pre-money / post-money valuation", d: "A startup's agreed value before new money goes in (pre) and after (post).", f: "Post-money = pre-money + amount raised", ex: "CHF 4m pre-money plus a CHF 1m raise → CHF 5m post-money. Your CHF 50,000 buys 1% of the post-money figure.", w: "Always check which one is being quoted. Confusing them can silently halve your stake." },
  "dilution": { t: "Dilution", d: "Your ownership percentage shrinking when the company issues new shares in later funding rounds.", f: "New % = old % × (1 − share of new shares issued)", ex: "You own 10%. The company issues shares equal to 20% of the company → you now own 8%.", w: "It happens at every round. That's fine if the value of each remaining point rises more than your percentage falls." },
  "SAFE": { t: "SAFE / convertible note", d: "A way of investing early without agreeing a valuation yet: your money converts into shares at the next proper funding round.", w: "Two terms decide everything — the valuation cap and the discount. Without a cap, you can fund a company early and receive almost nothing if it later raises at a huge valuation." },
  "valuation cap": { t: "Valuation cap", d: "The maximum valuation at which your early investment converts into shares, no matter how high the next round prices.", ex: "You invest with a CHF 5m cap. The next round happens at CHF 20m — you still convert as if the company were worth CHF 5m, so you get four times more shares.", w: "It's the single most important term for an early investor. Without it, your reward for taking the earliest risk gets competed away." },
  "pro-rata": { t: "Pro-rata rights", d: "The right to invest more in later rounds to keep your ownership percentage from shrinking.", w: "Only worth exercising if the company has genuinely improved. Following your money into a deteriorating business is how angels turn small losses into large ones." },
  "cap table": { t: "Cap table", d: "The list of who owns what percentage of a company.", w: "A messy one — big stakes held by people no longer involved — puts off future investors and can quietly kill a promising company." },
  "ARR": { t: "ARR / MRR", d: "Annual and monthly recurring revenue: the predictable subscription income a company collects.", f: "ARR = MRR × 12", ex: "CHF 30,000 a month → CHF 360,000 ARR.", w: "For software startups it's the main measure of real traction — but only if customers keep renewing. Check churn alongside it." },
  "churn": { t: "Churn", d: "The percentage of customers who leave in a given period.", ex: "8% monthly churn means that after a year, most of the customers you started with are gone.", w: "High churn means growth is a leaking bucket: the company must keep buying new customers just to stand still." },
  "burn rate": { t: "Burn rate & runway", d: "Burn rate is how much cash a startup loses each month. Runway is how many months remain before it runs out.", f: "Runway = cash in bank ÷ monthly burn", ex: "CHF 600,000 in the bank, burning CHF 50,000 a month → 12 months of runway.", w: "Under six months and the founders are raising money from a position of weakness, which usually means bad terms for everyone." },
  "power law": { t: "Power law", d: "The pattern of startup returns: most investments return nothing, and one or two produce almost all the gains.", ex: "In twenty angel investments, ten may go to zero, seven return little, and one might return 30×, paying for everything else.", w: "It's why angels make many small investments rather than a few large ones. With only five, you can easily catch none of the winners." },
  "unit economics": { t: "Unit economics", d: "Whether a single sale or single customer actually makes money once all the direct costs are counted.", ex: "A delivery marketplace taking CHF 4 per order but paying CHF 6 to the driver loses money on every order — growth makes it worse, not better.", w: "Companies with broken unit economics can look impressive while quietly destroying cash." },
  "GMV": { t: "GMV & take rate", d: "GMV is the total value of goods sold through a marketplace. The take rate is the percentage the marketplace keeps.", ex: "CHF 10m of GMV at a 4% take rate → CHF 400,000 of actual revenue.", w: "Founders quote GMV because it's the bigger number. Only the take rate reaches the company." },
  "liquidity": { t: "Liquidity / illiquidity", d: "How easily you can turn an investment back into cash.", w: "Shares are liquid — sold in seconds. Startup stakes are not: expect 7–12 years with no way out. Never invest money there that you might need." },
  "dry powder": { t: "Dry powder", d: "Cash held deliberately in reserve, ready to invest when opportunities appear.", w: "It looks lazy during a rising market and becomes the most valuable thing you own during a crash." },
  "REIT": { t: "REIT", d: "A listed company that owns rental property and is required to pay out most of its income as dividends.", w: "Judge it on cash flow per share rather than reported profit, since property depreciation distorts accounting profits badly. Sensitive to interest rates." },
  "shares outstanding": { t: "Shares outstanding", d: "The total number of shares that exist.", w: "Watch it over time. If it keeps rising, your slice is being quietly diluted — often to pay staff in shares." },
  "revenue": { t: "Revenue", d: "The total money coming in from sales, before any costs are deducted. Also called turnover or the top line.", w: "Revenue is vanity, profit is sanity, cash is reality. Plenty of high-revenue companies have never earned a franc." },
};
/* Alternative spellings that should resolve to the same entry */
const ALIASES = {
  "earnings per share": "EPS", "P/E ratio": "P/E", "price to earnings": "P/E",
  "PEG ratio": "PEG", "price to book": "P/B", "return on equity": "ROE",
  "moats": "moat", "discounted cash flow": "DCF", "cost of capital": "WACC",
  "free cash flow": "free cash flow",
  "capital expenditure": "capex", "growth capex": "capex",
  "depreciation": "D&A", "amortisation": "D&A", "depreciation & amortisation": "D&A",
  "net profit": "net income",
  "borrowings": "net debt", "debt/EBITDA": "net debt",
  "margin debt": "leverage", "levered": "leverage", "debt/EBITDA": "net debt/EBITDA", "leverage ratio": "net debt/EBITDA", "net debt to EBITDA": "net debt/EBITDA", "borrowed money": "leverage",
  "dividends": "dividend", "yield": "dividend yield",
  "compound": "compounding", "compounds": "compounding",
  "drawdowns": "drawdown", "volatile": "volatility",
  "diversified": "diversification", "diversification": "diversification",
  "allocation": "asset allocation", "rebalance": "rebalancing",
  "index funds": "index fund", "ETFs": "ETF",
  "expense ratio": "TER", "Umsatzabgabe": "stamp duty",
  "Verrechnungssteuer": "withholding tax", "pillar 3a": "Säule 3a",
  "capital gain": "capital gains", "professional securities dealer": "professional securities dealer",
  "cyclicals": "cyclical", "stalwarts": "stalwart", "fast growers": "fast grower",
  "turnarounds": "turnaround", "asset plays": "asset play", "value traps": "value trap",
  "tenbaggers": "tenbagger", "market capitalisation": "market cap", "market capitalization": "market cap",
  "buybacks": "buyback", "share buyback": "buyback",
  "post-money": "pre-money", "pre-money valuation": "pre-money", "post-money valuation": "pre-money",
  "dilute": "dilution", "diluted": "dilution", "convertible note": "SAFE", "SAFEs": "SAFE",
  "pro-rata rights": "pro-rata",
  "MRR": "ARR", "recurring revenue": "ARR", "runway": "burn rate",
  "take rate": "GMV", "illiquid": "liquidity", "illiquidity": "liquidity",
  "REITs": "REIT",
  "payout": "payout ratio", "intrinsic": "intrinsic value", "discount to intrinsic value": "discount to value",
  "fair value": "intrinsic value", "second level": "second-level thinking",
};

/* ============================================================
   PAPER INVESTOR — long-horizon investing trainer
   Palette: night ledger
   ============================================================ */
const C = {
  bg: "#0A1017",
  surface: "#121A24",
  surface2: "#18222E",
  line: "#22303D",
  text: "#E8E5DE",
  dim: "#8A97A6",
  brass: "#D6A64A",
  gain: "#3FA97A",
  loss: "#D06A5A",
  cool: "#5B8DB8",
};
const serif = "Georgia, 'Iowan Old Style', 'Times New Roman', serif";
const mono = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

/* ============================================================
   LESSONS — each unit maps to the books
   ============================================================ */
const UNITS = [
  { id: 1, name: "Money & Behaviour", source: "Housel · Stanley & Danko", color: C.brass },
  { id: 2, name: "Mr. Market", source: "Graham — The Intelligent Investor", color: C.cool },
  { id: 3, name: "Know What You Own", source: "Lynch — One Up on Wall Street", color: C.gain },
  { id: 4, name: "Moats", source: "Buffettology — Buffett & Clark", color: C.brass },
  { id: 5, name: "Valuation", source: "Pignataro · Sander & Haley · Little Book", color: C.cool },
  { id: 6, name: "Risk & Cycles", source: "Marks — The Most Important Thing", color: C.loss },
  { id: 7, name: "Portfolio Architecture", source: "Bernstein — Four Pillars", color: C.gain },
  { id: 8, name: "Passive Income", source: "Dividends, ETFs, Swiss tax reality", color: C.brass },
  { id: 9, name: "Startup / Angel", source: "Power law, dilution, SAFEs", color: C.cool },
  { id: 10, name: "Conviction", source: "Estebaranz — The Art of Investing", color: C.gain },
];

const LESSONS = [
  /* ---------- UNIT 1 ---------- */
  {
    id: "1a", unit: 1, title: "Behaviour beats IQ",
    cards: [
      { h: "Investing is not a maths exam", p: "Housel’s core claim: financial outcomes are driven by how you behave under stress, not by what you know. A person with average knowledge and iron discipline destroys a genius who panics. Every strategy in this app dies the moment you abandon it at the bottom." },
      { h: "Luck and risk are siblings", p: "Every visible outcome contains both. That means you cannot judge a decision by its result — you judge it by the process that produced it. Copying someone because they got rich is how you inherit their risk without their luck." },
      { h: "Getting rich ≠ staying rich", p: "Getting wealthy takes optimism and risk. Staying wealthy takes paranoia, low burn and survival. Only survival compounds: a portfolio that returns 20%, 20%, then −60% has lost money. Nothing beats being able to stay in the game." },
      { h: "The rule of 72", p: "Divide 72 by your annual return and you get the number of years your money takes to double. At 9% a year: 72 ÷ 9 = 8 years. At 6%: twelve years. At 3%: twenty-four. You can do it in your head, which is the entire point — it turns a vague promise into a number you can check." },
      { h: "Doubling is what does the work", p: "The rule matters because doubling repeats on the same clock. CHF 5,000 at 7% doubles roughly every 10 years: 10,000 at 28, 20,000 at 38, 40,000 at 48, 80,000 at 58. Notice the last doubling adds CHF 40,000 — more than the first four combined. This is why the years you invest early are worth more than the amounts you invest later, and why the most expensive decision is waiting." },
      { h: "Running it backwards", p: "Flip it and it becomes a lie detector. Someone promising to double your money in two years is claiming 36% a year (72 ÷ 2), roughly triple what the best investors alive sustain — so either the risk is enormous or the claim is false. It also prices fees: a 1.5% annual fee turns a 7% return into 5.5%, stretching each doubling from 10 years to 13. Over a lifetime that is one entire doubling lost. Treat it as an estimate; it is most accurate between about 5% and 15%." },
    ],
    quiz: [
      { type: "mc", q: "A friend put 90% of his savings into one coin and tripled it in six months. What is the correct conclusion?", options: ["He found an edge — ask him what to buy next", "The outcome is loud but proves nothing about the decision quality", "Concentration always beats diversification", "He is a better investor than you"], a: 1, why: "Judge process, not outcome. A high-variance bet that paid once tells you almost nothing about expected value. This is Housel’s luck/risk pair and Marks’ point that you must evaluate the decision as it looked before the result was known." },
      { type: "tf", q: "A 25% average annual return with one −70% year beats a steady 12% over 20 years.", a: false, why: "Compounding is multiplicative. One catastrophic year permanently removes the base that everything after it compounds on. Survival > peak return." },
      { type: "num", q: "Rule of 72: at a 9% annual return, roughly how many years to double your money?", a: 8, tol: 0.6, unit: "years", why: "72 ÷ 9 = 8 years. The rule of 72 is your fastest mental check on whether a return assumption is realistic." },
    ],
  },
  {
    id: "1b", unit: 1, title: "Wealth is what you don’t see",
    cards: [
      { h: "The PAW formula", p: "Stanley & Danko: expected net worth ≈ age × annual pre-tax income ÷ 10. Hit double that and you are a Prodigious Accumulator of Wealth (PAW). Half or less makes you an Under Accumulator (UAW) — regardless of how big your salary is." },
      { h: "Income is not wealth", p: "Wealth is the income you did not spend. A visible lifestyle is evidence of spending, not of assets. “Big hat, no cattle” is the single most expensive mistake young high earners make." },
      { h: "The one variable you control", p: "You cannot control returns. You can control your savings rate, your costs and your time horizon. At 18, time horizon is the largest asset on your balance sheet and it is non-renewable." },
    ],
    quiz: [
      { type: "num", q: "You are 34 and earn CHF 90,000 pre-tax. What is the expected net worth benchmark (in CHF)?", a: 306000, tol: 3000, unit: "CHF", why: "34 × 90,000 ÷ 10 = CHF 306,000. Doubling that (CHF 612,000) would classify you as a PAW." },
      { type: "mc", q: "Two neighbours: A earns 200k and has 80k net worth. B earns 70k and has 400k. Who is the better investor?", options: ["A — higher earning power", "B — converts income into assets", "Impossible to say", "Neither, both are below benchmark"], a: 1, why: "B has a far higher conversion rate of income into capital. Stanley’s research found most millionaires were in unglamorous businesses with high defence (saving) rather than record offence (earning)." },
      { type: "tf", q: "Raising your savings rate from 10% to 20% roughly halves the time to financial independence.", a: true, why: "It works from both ends: you accumulate faster AND you need a smaller pot because your annual spending is lower. Savings rate is the single most powerful lever before your capital gets large." },
    ],
  },
  /* ---------- UNIT 2 ---------- */
  {
    id: "2a", unit: 2, title: "Mr. Market",
    cards: [
      { h: "Graham’s parable (Ch. 8)", p: "Imagine a manic business partner who shows up every day quoting a price to buy your share or sell you his. Some days he is euphoric, some days terrified. He is there to serve you, not to instruct you. You are free to ignore him entirely." },
      { h: "Price is what you pay", p: "A falling price is new information about sentiment, not automatically about the business. The only question that matters: has the earning power of the business changed, or only the mood of the crowd?" },
      { h: "Discount to value: the calculation", p: "Once you have an estimate of what a business is worth, you need one number to describe how good today's price is. That number is the discount to value: subtract the price from your value estimate, then divide by your value estimate. You think it is worth CHF 100 and it trades at CHF 62 → (100 − 62) ÷ 100 = 0.38, a 38% discount. Always divide by the value, never by the price — dividing by price answers a different question." },
      { h: "What the discount is actually for", p: "It is your error budget, not your profit forecast. A 38% discount means your valuation could turn out to be 38% too optimistic and you would still not have overpaid. Graham wanted at least a third off for exactly this reason. It also puts every opportunity on one scale: a bank at a 40% discount and a software firm at 10% become directly comparable, no matter how different the businesses are." },
      { h: "The asymmetry hidden inside it", p: "Discount and upside are not the same number. Buying at CHF 62 something worth CHF 100 is a 38% discount but a 61% gain if the price ever reaches value (100 ÷ 62 − 1). The deeper the discount, the more violently the two diverge: a 50% discount is a 100% gain, a 75% discount is a 300% gain. This is the whole mechanical argument for waiting — patience does not improve the business, it improves the arithmetic. And the size of the discount you demand should rise with how uncertain your estimate is: a stable Swiss utility might justify buying at 20% off, a cyclical whose profits swing wildly might need 50%." },
      { h: "Defensive vs enterprising", p: "Graham splits investors by effort, not by risk appetite. The defensive investor buys broad index funds and rebalances. The enterprising investor does the work — statements, competitors, valuation. Choose honestly: the worst outcome is enterprising ambition with defensive effort." },
    ],
    quiz: [
      { type: "mc", q: "A company you own drops 30% in a week. No news about the business. Correct first action?", options: ["Sell — the market knows something", "Re-run your valuation; if unchanged, consider buying more", "Average down immediately without checking", "Set a stop-loss at −35%"], a: 1, why: "Mr. Market offering a lower price is an option, not a verdict. But re-checking your thesis first is mandatory — automatically averaging down is how value traps eat you (Unit 5)." },
      { type: "num", q: "You estimate intrinsic value at CHF 100. The market price is CHF 62. What discount to value are you buying at (%)?", a: 38, tol: 1, unit: "%", why: "(100 − 62) ÷ 100 = 38%. Graham wanted a large gap precisely because your estimate of 100 might be wrong." },
      { type: "tf", q: "Volatility and risk are the same thing.", a: false, why: "Marks and Graham both reject this. Volatility is price movement; risk is the permanent loss of capital. A stable stock with a levered balance sheet is often riskier than a jumpy one with net cash." },
    ],
  },
  {
    id: "2b", unit: 2, title: "Margin of safety",
    cards: [
      { h: "The three words (Ch. 20)", p: "Graham reduced sound investing to “margin of safety”: buy so far below your estimate of value that being wrong still leaves you whole. It is not a prediction tool — it is an admission that your forecast will be wrong." },
      { h: "Where safety comes from", p: "Three sources: a low price relative to value, a business whose earning power is durable, and diversification so that a single error is not fatal. Stack them; never rely on one." },
      { h: "How much debt is too much", p: "The standard measure is net debt ÷ EBITDA — roughly, how many years of operating profit it would take to repay everything the company owes. Under 2× is comfortable. Around 3× is stretched. Above 4×, the lenders effectively set the strategy, not the management. A company at 4× with falling sales is in the worst possible position: as profits shrink the ratio worsens on its own, and when the loan comes up for renewal the bank can demand repayment, a share issue that dilutes you, or asset sales at terrible prices." },
      { h: "Why debt destroys safety", p: "Your one structural advantage as a private investor is that nobody can force you to act — you can hold for a decade while the market changes its mind. Debt removes exactly that advantage from the company you own. A cheap, unlevered business can sit out a bad five years; a cheap, heavily indebted one can be wiped out during them, with the shares going to zero while the assets go to the lenders. This is why a low P/E means nothing until you have checked the balance sheet." },
      { h: "Graham's two ceilings", p: "For cautious investors Graham set two separate price limits. Never pay more than 15 times annual profit — that is a P/E of 15. And never pay more than 1.5 times the company's accounting value — that is a P/B of 1.5. The first limits what you pay for profits, the second limits what you pay for assets." },
      { h: "Where the 22.5 comes from", p: "Applying both limits rigidly is too strict: a company with unusually cheap assets but a slightly high P/E would be rejected for no good reason. So Graham let one ceiling be breached if the other is low enough to compensate. He simply multiplied them: 15 × 1.5 = 22.5. That single number is the entire origin of the formula — nothing mystical, just his two rules combined into one. This is what 'the combined earnings and assets limit' means." },
      { h: "The Graham number", p: "The formula turns that combined ceiling into a maximum price per share: √(22.5 × EPS × book value per share). Take EPS of CHF 3 and book value per share of CHF 20 → 22.5 × 3 × 20 = 1350, and √1350 ≈ CHF 36.74. That is the most a defensive investor should pay. The square root is there because you multiplied two per-share figures together, so you need to bring the result back down to a single per-share price." },
      { h: "Reading the result", p: "At CHF 36.74 the P/E is 12.2 (36.74 ÷ 3) and the P/B is 1.84 (36.74 ÷ 20). The P/E sits below the limit of 15 while the P/B sits above 1.5 — the cheap earnings are paying for the expensive assets, which is exactly the trade Graham allowed. Multiply the two and you get 22.5 again. Pay more than CHF 36.74 and you break the combined ceiling." },
      { h: "When to ignore it", p: "It is a screening filter, not an analysis. It works on banks, insurers, industrials and property — businesses whose value genuinely sits on the balance sheet. It is useless for software, brands or anything whose worth is code, patents and people, because those barely appear in book value. Applied to Microsoft it would have told you to never buy at any price for thirty years." },
    ],
    quiz: [
      { type: "num", q: "EPS is CHF 3.00 and book value per share is CHF 20. What is the Graham number (CHF)?", a: 36.74, tol: 1, unit: "CHF", why: "22.5 × 3 × 20 = 1350, and √1350 ≈ 36.74. Remember the 22.5 is just Graham’s two limits multiplied together: 15 times earnings × 1.5 times book value. At CHF 36.74 you would be paying a P/E of 12.2 and a P/B of 1.84 — cheap on profits, dear on assets, which nets out to exactly his ceiling. Pay more and you breach it." },
      { type: "mc", q: "Which position has the weakest margin of safety?", options: ["Profitable, net cash, bought at 40% below your DCF", "Cheap on P/E but 4× net debt/EBITDA and falling sales", "Boring stalwart at fair value with 25 years of dividends", "Index fund bought after a 30% market decline"], a: 1, why: "Statistical cheapness plus leverage plus deterioration is the classic value trap. Debt removes your ability to wait, which is the whole asset of a long-horizon investor." },
      { type: "tf", q: "Margin of safety means you have accurately predicted the future.", a: false, why: "The opposite. It exists because you have not." },
    ],
  },
  /* ---------- UNIT 3 ---------- */
  {
    id: "3a", unit: 3, title: "Lynch’s six categories",
    cards: [
      { h: "Classify before you value", p: "Lynch: you cannot judge a result without knowing the game. Slow growers (2–4% growth, big dividend), stalwarts (8–12%, defensive compounders), fast growers (20%+, where tenbaggers live), cyclicals (earnings swing with the economy), turnarounds (broken but fixable), asset plays (worth more dead than alive)." },
      { h: "Cyclicals invert the rules", p: "For a cyclical, a low P/E is usually a warning that earnings are at a peak, and a high or negative P/E can mark the bottom. Applying a stalwart’s logic to a cyclical is one of the most common ways private investors lose money." },
      { h: "Know what you own", p: "The two-minute drill: if you cannot explain in two minutes why you own it — what the company sells, why it wins, what has to go right — you do not own an investment, you own a ticker." },
    ],
    quiz: [
      { type: "mc", q: "A steel producer trades at a P/E of 4 after two record years. Most likely reading?", options: ["Deep value — buy aggressively", "Peak-cycle earnings; the low P/E is a warning", "A fast grower being ignored", "An asset play"], a: 1, why: "Classic Lynch cyclical. The E in P/E is inflated by the cycle top. You want cyclicals when the P/E looks terrible and capacity is being shut down." },
      { type: "mc", q: "Nestlé-type business: 4–6% growth, huge brand portfolio, reliable dividend. Category?", options: ["Fast grower", "Turnaround", "Stalwart", "Asset play"], a: 2, why: "Stalwart. Expect 30–50% gains over years plus dividends, not tenbaggers. Lynch sized these to cushion drawdowns, not to drive returns." },
      { type: "tf", q: "“Invest in what you know” means buying a product you like is sufficient research.", a: false, why: "Lynch is misquoted constantly. Familiarity generates the idea; the financials decide the investment. He explicitly demanded you check the balance sheet and growth rate afterwards." },
    ],
  },
  {
    id: "3b", unit: 3, title: "PEG, tenbaggers, diworsification",
    cards: [
      { h: "PEG in one line", p: "P/E divided by the earnings growth rate. Below 1 is interesting, around 0.5 is very attractive, above 2 you are paying for growth that must actually arrive. Lynch used it to compare businesses that are otherwise not comparable." },
      { h: "Tails drive the portfolio", p: "Lynch’s record came from a small number of tenbaggers that paid for many losers. Because a stock can only fall 100% but rise 1,000%, you can be wrong more than half the time and still win — if you let winners run and size losers small." },
      { h: "Diworsification", p: "Watch for companies buying unrelated businesses with shareholder cash. It usually signals that management has run out of high-return ideas in its core and would rather build an empire than return capital." },
    ],
    quiz: [
      { type: "num", q: "P/E is 18 and sustainable earnings growth is 24%. What is the PEG?", a: 0.75, tol: 0.05, why: "18 ÷ 24 = 0.75. Below 1 means you are paying less than a point of P/E per point of growth." },
      { type: "mc", q: "Your position is up 240% and now looks expensive on P/E, but growth is accelerating and the runway is long. Lynch’s instinct?", options: ["Sell — never let a gain turn into a loss", "Trim to the original size mechanically", "Hold while the story is intact; selling winners early caps your tails", "Double down with leverage"], a: 2, why: "“Pulling the flowers and watering the weeds.” The sell decision is driven by the story breaking, not by the price having gone up." },
      { type: "tf", q: "A software company acquiring a chain of restaurants is a positive signal about capital allocation.", a: false, why: "Textbook diworsification." },
    ],
  },
  /* ---------- UNIT 4 ---------- */
  {
    id: "4a", unit: 4, title: "Consumer monopoly vs commodity",
    cards: [
      { h: "The two business types", p: "Buffett & Clark split the world in two. Commodity businesses sell an undifferentiated product, compete on price, and earn low returns forever. Consumer monopolies own something in the customer’s head or in the infrastructure — a brand, a habit, a network, a switching cost — and can raise prices without losing volume." },
      { h: "The pricing power test", p: "Ask one question: if this company raised prices 10% tomorrow, what happens? If volumes collapse, it is a commodity. If customers grumble and pay, you have found a moat — and inflation becomes an ally rather than an enemy." },
      { h: "ROE consistency", p: "Buffettology screens for return on equity consistently above ~15% without heavy debt, over 10 years. Consistency matters more than the peak: a single good year is noise, a decade is evidence of structure." },
    ],
    quiz: [
      { type: "mc", q: "Which is most likely a consumer monopoly?", options: ["An airline on the Zurich–London route", "A payment network taking a fee on every card swipe", "A generic paper mill", "A regional construction contractor"], a: 1, why: "A payment network has a two-sided network effect: more cards attract more merchants, which attract more cards. Airlines, mills and contractors compete on price and capacity." },
      { type: "mc", q: "Company A: ROE 22% every year for 10 years, low debt. Company B: ROE 30% but debt/equity of 3. Which is the stronger business?", options: ["B — higher ROE", "A — the return is not manufactured by leverage", "Identical", "B, if interest rates stay low"], a: 1, why: "Leverage inflates ROE while adding fragility. Buffett strips out debt-driven returns because debt destroys your ability to survive a bad decade." },
      { type: "tf", q: "A strong brand alone guarantees a moat.", a: false, why: "The brand must translate into pricing power or repeat purchase. Plenty of famous brands earn commodity returns." },
    ],
  },
  {
    id: "4b", unit: 4, title: "Equity bonds & the retained earnings test",
    cards: [
      { h: "Stocks as equity bonds", p: "Buffett reframes a share as a bond whose coupon is EPS and whose face value is book value — except the coupon grows. If you pay CHF 60 for EPS of CHF 4, your initial “coupon yield” is 6.7%, and the question becomes how fast that coupon grows." },
      { h: "The one-dollar test", p: "For every franc of earnings retained rather than paid out, has the company created at least one franc of market value over time? If not, management is destroying capital and the dividend should be higher." },
      { h: "Projecting a return", p: "Grow today’s EPS at a conservative rate for 10 years, apply a conservative exit multiple, add dividends, then compute the annual return from today’s price. If that number is not clearly above what an index gives you, do nothing." },
    ],
    quiz: [
      { type: "num", q: "EPS is CHF 5, growing 12% for 10 years. What is EPS in year 10 (CHF)?", a: 15.53, tol: 0.6, unit: "CHF", why: "5 × 1.12^10 ≈ 15.53. This is the whole engine of long-horizon investing: the multiple is noise, the earnings path is signal." },
      { type: "num", q: "That year-10 EPS of 15.53 at an exit P/E of 15 gives ~CHF 233. You pay CHF 60 today. What is the approximate annual return (%)?", a: 14.5, tol: 1.5, unit: "%", why: "(233 ÷ 60)^(1/10) − 1 ≈ 14.5% per year before dividends. Now compare it against a global index at ~7% — this is how you decide whether the work was worth it." },
      { type: "tf", q: "A company retaining all earnings while its market value stagnates for a decade passes the one-dollar test.", a: false, why: "It fails. That capital would have been worth more in your hands." },
    ],
  },
  /* ---------- UNIT 5 ---------- */
  {
    id: "5a", unit: 5, title: "What a business is actually worth",
    cards: [
      { h: "Four lenses", p: "Asset value (what the balance sheet is worth), earnings power value (current profits capitalised, assuming zero growth), growth value (only real when returns exceed the cost of capital), and comparables (what the market pays for similar businesses). Value investors weight the first two heavily because they require the fewest assumptions." },
      { h: "P/E is a shortcut, not a value", p: "A P/E is the answer to a DCF you did not do. It bundles growth, risk, capital intensity and accounting policy into one number. Use it to compare, never to conclude." },
      { h: "Quality of earnings", p: "Profit is an opinion, cash is a fact. Check whether net income converts into operating cash flow. If receivables and inventories consistently grow faster than sales, the earnings are being manufactured on paper." },
    ],
    quiz: [
      { type: "mc", q: "Two companies both earn CHF 100m. A needs CHF 90m of capex to stand still, B needs CHF 15m. Which is worth more?", options: ["Equal — same earnings", "A — heavier assets", "B — far more of the profit is actually distributable", "Cannot say without the P/E"], a: 2, why: "Owner earnings, not net income, is what you can take out. Capital intensity is the difference between a compounder and a treadmill." },
      { type: "tf", q: "Sales growing 8% while receivables grow 40% is a normal, healthy pattern.", a: false, why: "It usually means revenue is being recognised on sales that have not been collected — a classic earnings-quality red flag." },
      { type: "mc", q: "Which valuation input do you have the least ability to forecast?", options: ["Current book value", "Trailing free cash flow", "The terminal multiple in 10 years", "This year’s dividend"], a: 2, why: "The terminal value usually drives 60–80% of a DCF and is the least knowable input. Pignataro’s modelling discipline is precisely about knowing which assumptions carry the answer." },
    ],
  },
  {
    id: "5b", unit: 5, title: "Owner earnings & DCF mechanics",
    cards: [
      { h: "Owner earnings", p: "Net income + depreciation & amortisation − maintenance capex ± working capital change. Buffett’s definition of what the owner can actually pull out of the business each year without shrinking it." },
      { h: "The DCF in one sentence", p: "Project free cash flow for 5–10 years, discount each year back at your required return (or WACC), add a terminal value, subtract net debt, divide by shares. Everything else is decoration." },
      { h: "The discount rate is your hurdle", p: "In practice most private investors skip WACC and use a required return: “I want 10% a year, what can I pay?” That inverts the model into a decision tool instead of a false precision machine." },
    ],
    quiz: [
      { type: "num", q: "Net income 120, D&A 40, maintenance capex 55, working capital increase 10. Owner earnings?", a: 95, tol: 1, why: "120 + 40 − 55 − 10 = 95. Growth capex is excluded; only what is needed to stand still is subtracted." },
      { type: "num", q: "A business will produce CHF 10m of cash flow forever with no growth. You require a 10% return. Maximum price?", a: 100, tol: 2, unit: "m CHF", why: "Perpetuity value = cash flow ÷ discount rate = 10 ÷ 0.10 = CHF 100m. Everything above that is you accepting a lower return." },
      { type: "tf", q: "A DCF with 20 years of detailed projections is more reliable than one with 5 years plus a conservative terminal value.", a: false, why: "Longer projections add precision, not accuracy. The extra years mostly encode your optimism." },
    ],
  },
  {
    id: "5c", unit: 5, title: "Cheap vs value trap",
    cards: [
      { h: "The trap", p: "A low multiple on declining earnings is not cheap — it is expensive in slow motion. The multiple falls as fast as the earnings do, so the price never rises. Newspapers, video rental, mall retail: all were statistically cheap the whole way down." },
      { h: "What separates value from trap", p: "Three things: a balance sheet strong enough to wait, earnings that stabilise rather than erode, and something that changes — a catalyst, new management, a divestment, a buyback at a low price." },
      { h: "Quality at a fair price", p: "The Little Book approach still works (low P/B, low P/E, insider buying, dividends), but modern practice adds a durability filter. Buffett’s shift: better to buy a wonderful business at a fair price than a fair business at a wonderful price." },
    ],
    quiz: [
      { type: "mc", q: "Which single fact most reliably distinguishes value from value trap?", options: ["Low P/E", "High dividend yield", "Stabilising or growing owner earnings", "A famous investor owns it"], a: 2, why: "Everything else is a snapshot. Whether cash generation has stopped deteriorating tells you if the discount can ever close." },
      { type: "tf", q: "Insiders buying shares with their own money is a meaningful positive signal.", a: true, why: "Insiders sell for many reasons but buy for essentially one. It is one of the few signals with persistent statistical support." },
      { type: "mc", q: "A retailer trades at 0.4× book. Book is mostly ageing stores on long leases and slow-moving inventory. Real margin of safety?", options: ["Yes — 60% below book", "No — the book value is unlikely to be realisable", "Yes if the dividend holds", "Only if it is a turnaround"], a: 1, why: "Asset value only protects you if the assets can be sold at carrying value. Leases are liabilities, and stale inventory is worth far less than stated." },
    ],
  },
  /* ---------- UNIT 6 ---------- */
  {
    id: "6a", unit: 6, title: "Second-level thinking",
    cards: [
      { h: "First vs second level", p: "First level: “It’s a good company, buy it.” Second level: “It’s a good company, but everyone knows that and the price already assumes perfection, so the expected return is poor.” Marks: you cannot do the same thing as everyone else and expect a different result." },
      { h: "You must be non-consensus AND right", p: "Being contrarian alone is just being wrong in an unusual direction. The edge comes from holding a view that differs from the crowd for a reason the crowd is ignoring, and being correct about it." },
      { h: "Price already contains the story", p: "Good news is not the same as good investment. The question is never “is this a great business?” but “is it great relative to what the price demands?”" },
    ],
    quiz: [
      { type: "mc", q: "Everyone agrees a company will grow 30% a year for a decade, and it trades at 70× earnings. Second-level view?", options: ["Buy — consensus confirms quality", "The consensus is in the price; the return depends on beating it", "Short it — high multiples always fall", "Ignore, wait for a crash"], a: 1, why: "At 70× you are not paid for the expected case, only for the case that exceeds expectations. Marks: superior results come from a gap between perception and reality." },
      { type: "tf", q: "Buying what everybody hates is automatically second-level thinking.", a: false, why: "Contrarianism without an analytical reason is a coin flip with worse odds." },
      { type: "mc", q: "Which of these is a genuine second-level question?", options: ["Will earnings grow?", "Is the chart breaking out?", "What is priced in, and what would have to be true for me to be wrong?", "What is the analyst target price?"], a: 2, why: "Inverting the thesis is the core discipline: state explicitly what would falsify you, before you buy." },
    ],
  },
  {
    id: "6b", unit: 6, title: "Risk, cycles and the pendulum",
    cards: [
      { h: "Risk is permanent loss", p: "Not volatility, not tracking error. Risk is the probability that capital does not come back. It is highest exactly when it feels lowest — when prices have risen for years and everyone has been rewarded for taking more risk." },
      { h: "The pendulum", p: "Markets swing between euphoria and despair, and they spend very little time at the fair midpoint. You cannot time the swing, but you can know where you are on it and adjust aggressiveness accordingly." },
      { h: "You can’t predict, you can prepare", p: "Preparation means: cash reserve so you are never a forced seller, no leverage that can be called, position sizes that survive a 50% decline, and a written buy list for when prices collapse. Prepared beats prescient." },
    ],
    quiz: [
      { type: "mc", q: "When is risk highest?", options: ["After a 40% crash when volatility is extreme", "After years of gains when nobody sees a threat", "When interest rates rise", "During earnings season"], a: 1, why: "Risk enters the market through price and complacency. After a crash, prices already embed pessimism — that is when the risk of permanent loss is often lowest." },
      { type: "tf", q: "Using margin debt is acceptable if your analysis is sound.", a: false, why: "Leverage converts a temporary price decline into a permanent loss by forcing you to sell at the worst moment. It removes the one advantage a private long-horizon investor has: the ability to wait." },
      { type: "mc", q: "Markets fall 35%. You hold 12% cash and a written watchlist. Correct move?", options: ["Wait for the exact bottom", "Deploy in tranches against your pre-written list", "Sell to avoid further losses", "Switch entirely to bonds"], a: 1, why: "Tranching accepts you cannot pick the bottom while guaranteeing you participate. The pre-written list exists because your judgement is worst under stress." },
    ],
  },
  /* ---------- UNIT 7 ---------- */
  {
    id: "7a", unit: 7, title: "Bernstein’s four pillars",
    cards: [
      { h: "Theory, history, psychology, business", p: "Bernstein: risk and return are joined at the hip; market history rhymes through manias and panics; your own brain is the main adversary; and the finance industry’s interests are not yours. Skip any pillar and the other three will not save you." },
      { h: "Allocation dominates selection", p: "The split between equities, bonds, cash and property explains far more of your long-run outcome than which stocks you pick. Decide that first, in writing, and let stock picking be the smaller layer on top." },
      { h: "History as a risk model", p: "Global markets have delivered roughly 6–7% real per year over the long run — with 50%+ drawdowns along the way. Any plan that has not budgeted for a halving is not a plan." },
    ],
    quiz: [
      { type: "mc", q: "Which decision most determines your 30-year outcome?", options: ["Which individual stocks you own", "Your asset allocation and how consistently you keep it", "Your entry timing", "Your broker"], a: 1, why: "Allocation plus behaviour. Selection matters but sits far below these in explanatory power." },
      { type: "num", q: "A portfolio drops 50%. What return is needed just to get back to even (%)?", a: 100, tol: 2, unit: "%", why: "Losses are asymmetric: −50% needs +100%. This is why avoiding catastrophe outranks capturing every upside." },
      { type: "tf", q: "Rebalancing forces you to sell what has risen and buy what has fallen.", a: true, why: "That is its entire value: a mechanical, unemotional contrarian rule with a pre-agreed trigger." },
    ],
  },
  {
    id: "7b", unit: 7, title: "Costs, index core, rebalancing",
    cards: [
      { h: "Costs are the only guaranteed return", p: "A 1.5% annual fee compounds against you exactly like a return compounds for you. Over 40 years it can consume a third or more of your final capital. Bernstein’s fourth pillar: the industry is engineered to extract that fee." },
      { h: "Core and satellite", p: "A practical structure: a low-cost global index core (say 70–90%) plus a satellite of individual businesses you have actually researched. The core guarantees you get the market return; the satellite is where your work either pays or teaches you something." },
      { h: "Swiss specifics", p: "Swiss brokers charge Umsatzabgabe (stamp duty) of roughly 0.075% on domestic and 0.15% on foreign securities; foreign brokers do not. Säule 3a gives you a tax deduction and is available to you as an apprentice with earned income. Verify current limits before relying on any number." },
    ],
    quiz: [
      { type: "num", q: "CHF 100,000 compounding at 7% for 30 years vs 5.5% (after a 1.5% fee). Roughly what percentage of the final value is lost to the fee?", a: 35, tol: 6, unit: "%", why: "7% → ~761k; 5.5% → ~499k. About 34% of the final value goes to fees. This is the strongest argument for a cheap index core." },
      { type: "mc", q: "Best structure for someone with limited research time and a 30-year horizon?", options: ["100% individual stock picks", "Global index core with a small researched satellite", "Cash until markets fall", "Actively managed funds only"], a: 1, why: "It guarantees market participation while keeping the upside from your own work — and it makes your stock-picking record measurable against a real benchmark." },
      { type: "tf", q: "A fund that beat the market for three years is likely to keep doing so.", a: false, why: "Short-run outperformance is dominated by luck and factor exposure. Persistence studies find very little skill survives fees." },
    ],
  },
  /* ---------- UNIT 8 ---------- */
  {
    id: "8a", unit: 8, title: "Dividends: the real mechanics",
    cards: [
      { h: "Yield is not income", p: "A dividend is a transfer of value out of the share price, not free money. What creates real income is the underlying earnings growing and the payout being sustainable — otherwise you are being paid with your own capital." },
      { h: "The payout ratio test", p: "Dividends ÷ earnings (better: ÷ free cash flow). Under ~60% is generally sustainable for a stable business. Above 100% means the dividend is funded by debt or asset sales and a cut is coming, usually alongside a price collapse." },
      { h: "Yield on cost", p: "Buy at CHF 50 with a CHF 1.50 dividend (3%). If the dividend grows 8% a year, in 15 years it is CHF 4.76 — a 9.5% yield on your original cost. Dividend growth, not starting yield, builds passive income." },
    ],
    quiz: [
      { type: "mc", q: "Stock A yields 9%, payout ratio 130%, falling revenue. Stock B yields 2.5%, payout 40%, dividend growing 10%/yr. Better passive income engine over 20 years?", options: ["A — three times the income today", "B — sustainable and compounding", "Equal", "A, then switch to B"], a: 1, why: "A is very likely to cut, taking the price with it. B’s income overtakes it within roughly a decade and keeps going." },
      { type: "num", q: "You buy at CHF 50 with a CHF 1.50 annual dividend. It grows 8% a year. What is the dividend after 15 years (CHF)?", a: 4.76, tol: 0.3, unit: "CHF", why: "1.50 × 1.08^15 ≈ 4.76, a 9.5% yield on your original cost. This is the mechanism behind long-term dividend income." },
      { type: "tf", q: "A very high dividend yield is generally a sign of a bargain.", a: false, why: "It is usually the market pricing in a cut. Yield rises because the price fell for a reason." },
    ],
  },
  {
    id: "8b", unit: 8, title: "Building the income stream (Swiss reality)",
    cards: [
      { h: "Total return first", p: "Whether income arrives as a dividend or as a sold slice of an appreciated position is mostly a tax and psychology question. Optimise total return, then choose the withdrawal method — not the reverse." },
      { h: "Swiss tax structure", p: "For private investors in Switzerland, capital gains on securities are generally tax-free, while dividends and interest are taxed as income. That asymmetry favours accumulating funds and low-yield compounders over high-yield strategies. Trade too actively and you risk being reclassified as a professional securities dealer, which removes the exemption." },
      { h: "Withholding and fund domicile", p: "Swiss Verrechnungssteuer of 35% is withheld on Swiss dividends and reclaimed via your tax return. Irish-domiciled ETFs (IE ISIN) typically reduce US withholding to 15% versus 30% for many alternatives. Verify current treaty and fund details — these rules change." },
    ],
    quiz: [
      { type: "mc", q: "As a Swiss private investor with a 30-year horizon, which is structurally most tax-efficient?", options: ["High-yield dividend portfolio", "Accumulating global index fund plus low-yield compounders", "Frequent trading of momentum names", "Cash savings account"], a: 1, why: "Untaxed capital gains plus deferred dividend drag. High yield converts return into taxable income every single year." },
      { type: "tf", q: "Very frequent trading can cost a Swiss private investor the capital gains exemption.", a: true, why: "Professional securities dealer classification considers holding period, volume, leverage and how central trading income is to your livelihood. Get advice before trading heavily — this app is not tax advice." },
      { type: "num", q: "You need CHF 3,000/month passive income. At a 3.5% sustainable withdrawal rate, what capital is required (CHF)?", a: 1028571, tol: 30000, unit: "CHF", why: "36,000 ÷ 0.035 ≈ CHF 1.03m. Working backwards from the number is the only way to know whether your savings rate is remotely on track." },
    ],
  },
  /* ---------- UNIT 9 ---------- */
  {
    id: "9a", unit: 9, title: "The power law",
    cards: [
      { h: "Startup returns are not normal", p: "In a typical angel portfolio, roughly half the investments return zero, a third return something modest, and one or two produce the entire return. The mathematics rewards portfolio construction over deal picking." },
      { h: "Why 20+ cheques", p: "If one in twenty produces a 30× outcome, holding five investments gives you a real chance of catching none. Angels who put the same total capital into 25 small cheques outperform those who put it into 5 large ones — same money, far better hit probability." },
      { h: "Illiquidity is the price", p: "Expect 7–12 years to any exit, no ability to sell, no market price, and dilution along the way. Never invest money you might need. As a founder yourself, remember your own human capital is already fully exposed to this asset class." },
    ],
    quiz: [
      { type: "mc", q: "You have CHF 50,000 for angel investing. Best structure?", options: ["One CHF 50k cheque into your best idea", "Five CHF 10k cheques", "Twenty CHF 2.5k cheques across sectors and years", "Wait until you can write a CHF 200k cheque"], a: 2, why: "Power-law maths: you need enough shots to catch the tail. Spreading across vintages also protects you from investing everything at one point in the funding cycle." },
      { type: "tf", q: "A startup portfolio where 60% of positions go to zero is a failed portfolio.", a: false, why: "That is the normal shape of a functioning angel portfolio. What matters is whether one position returned 20× or more." },
      { type: "mc", q: "Biggest risk of investing in a friend’s startup?", options: ["The valuation", "That you cannot assess it objectively and cannot exit the relationship", "Legal fees", "Dilution"], a: 1, why: "Every angel loss is survivable; a destroyed friendship plus a loss is not. If you do it, size it as money you have written off on day one." },
    ],
  },
  {
    id: "9b", unit: 9, title: "Dilution, SAFEs and signals",
    cards: [
      { h: "Dilution maths", p: "Your percentage falls at every round. Own 10% and the company issues 20% of new shares? You now own 8%. Across four rounds you may end at a third of your starting stake — which is fine if the value per point rose more than your share fell." },
      { h: "SAFEs and convertibles", p: "You lend value now and convert to equity at the next priced round. Two terms matter: the valuation cap (the maximum valuation at which you convert) and the discount (typically 15–25%). No cap means you can fund a company and receive almost nothing if it raises at a huge valuation." },
      { h: "Signals worth paying for", p: "Founders with domain scars, real customer revenue rather than letters of intent, a market that already spends money on the problem, tight cap table, and founders who take a low salary. Signals worth ignoring: press coverage, accelerator badges, a slick deck." },
    ],
    quiz: [
      { type: "num", q: "You own 10%. The company issues new shares equal to 20% of the post-round cap table. What do you own after (%)?", a: 8, tol: 0.2, unit: "%", why: "10% × (1 − 0.20) = 8%. Every round applies this multiplicatively." },
      { type: "mc", q: "You invest CHF 25,000 on a SAFE with a CHF 5m cap and 20% discount. The next round prices at CHF 20m. What happens?", options: ["You convert at CHF 20m", "You convert at CHF 16m (the discount)", "You convert at the CHF 5m cap — the better term for you", "The SAFE expires"], a: 2, why: "You get the more favourable of cap and discount. The cap converts your 25k as if the company were worth 5m — a 4× better position than converting at the round price." },
      { type: "tf", q: "A startup with heavy press coverage and no paying customers is a strong signal.", a: false, why: "Press is a marketing output, not evidence of demand. Revenue from strangers is the only signal that is hard to fake." },
    ],
  },
  /* ---------- UNIT 10 ---------- */
  {
    id: "10a", unit: 10, title: "Conviction, concentration, patience",
    cards: [
      { h: "Concentration cuts both ways", p: "Estebaranz argues that meaningful outperformance comes from a concentrated book of deeply researched ideas — but concentration multiplies the cost of being wrong. The honest rule: concentrate only in proportion to the work you have actually done, and only with money you cannot be forced to sell." },
      { h: "The three reasons to sell", p: "One: the thesis is broken. Two: the price now exceeds any reasonable value. Three: you found something clearly better and capital is limited. “It went down” and “it went up” are not on the list." },
      { h: "Time arbitrage", p: "Your structural edge over professionals is that nobody can fire you for a bad quarter. Institutions are forced to be short-term; you are not. That patience is the only edge you have that cannot be competed away." },
    ],
    quiz: [
      { type: "mc", q: "Your best-researched position has grown to 35% of your portfolio. Thesis intact, valuation still reasonable. Action?", options: ["Trim to 5% immediately", "Hold, but define in writing the maximum loss you can absorb", "Add more with borrowed money", "Sell half to lock in gains"], a: 1, why: "Neither dogma works. The discipline is to size by conviction AND by survivability: if a 60% decline in that one name would end your plan, it is too big regardless of conviction." },
      { type: "mc", q: "Which is a valid reason to sell?", options: ["The stock fell 25%", "A better opportunity exists and capital is limited", "It has been flat for two years", "A famous investor sold"], a: 1, why: "Opportunity cost is the only price-independent reason on the list. The other three are noise or impatience." },
      { type: "tf", q: "Being unable to be fired for underperformance is a genuine structural edge for a private investor.", a: true, why: "Time arbitrage. Most professional capital cannot hold through a three-year drawdown; you can, which is why cheap and unloved is available to you at all." },
    ],
  },
];

/* ============================================================
   SCENARIOS — real decisions, scored against book principles
   ============================================================ */
const SCENARIOS = [
  {
    id: "s1", title: "The 34% drawdown", tag: "Marks · Graham",
    setup: "A global recession hits. Your portfolio is down 34% in four months. Every headline says this is different. Your holdings are still profitable, still growing, and now trade at half their earnings multiple from last year. You have 10% cash and a 25-year horizon.",
    options: [
      { t: "Sell everything and wait for clarity", s: -3, f: "Clarity arrives only after prices have recovered. Selling here converts a temporary quote decline into a permanent loss and puts you in the position of having to be right twice." },
      { t: "Do nothing at all", s: 1, f: "Not a mistake. But you are wasting the only thing a bear market gives you — prices below value — while holding cash you set aside for exactly this." },
      { t: "Deploy the cash in three tranches over the next months against a pre-written list", s: 3, f: "Correct. You accept you cannot pick the bottom while guaranteeing participation. Marks: you can’t predict, you can prepare. The pre-written list bypasses your worst instincts under stress." },
      { t: "Borrow on margin — this is a generational opportunity", s: -3, f: "Leverage is how good analysis produces bankruptcy. A further 30% decline forces you to sell at the exact bottom. Never surrender the ability to wait." },
    ],
  },
  {
    id: "s2", title: "Earnings miss", tag: "Lynch · Graham",
    setup: "A stalwart you own misses quarterly earnings by 8% and drops 22% in a day. Reading the report: the miss came from a one-off currency effect and a factory upgrade. Volumes grew, market share grew, the balance sheet is unchanged.",
    options: [
      { t: "Sell — the market has spoken", s: -2, f: "You outsourced your judgement to a one-day price move. Mr. Market is a servant, not an oracle." },
      { t: "Re-check the thesis; if intact, add to the position", s: 3, f: "Correct sequence: verify first, then act. Volumes and share growing while the multiple compresses is the definition of Mr. Market offering you a discount." },
      { t: "Hold and add nothing", s: 1, f: "Defensible, but if your work says the business is unchanged and the price is 22% lower, doing nothing means you did not believe your own analysis." },
      { t: "Set a stop-loss 10% lower to protect yourself", s: -2, f: "Stop-losses guarantee you sell into panic. They are a trading tool applied to an investing horizon." },
    ],
  },
  {
    id: "s3", title: "The friend’s round", tag: "Angel · Housel",
    setup: "A friend is raising CHF 300,000 at a CHF 4m valuation for a hardware startup. Twelve months in, an unfinished prototype, no revenue, two paying pilot letters of intent. He asks you for CHF 15,000 — which is 60% of your liquid savings.",
    options: [
      { t: "Invest the full CHF 15,000 — you believe in him", s: -3, f: "Sixty percent of liquid savings into a pre-revenue single position violates both power-law maths and basic survival. Belief in a person is not a portfolio strategy." },
      { t: "Invest CHF 2,000, sized as money already written off", s: 2, f: "Sensible. Small enough to preserve both your capital base and the friendship. Consider whether you can even assess this objectively — you probably cannot." },
      { t: "Decline, explain honestly, offer help instead of cash", s: 3, f: "The strongest answer at your capital level. Letters of intent are not revenue, and one cheque this size cannot work in a power-law asset class. Time and introductions cost you nothing and are often worth more." },
      { t: "Invest CHF 15,000 but demand a board seat", s: -2, f: "Governance does not fix position sizing, and a board seat on a pre-revenue startup mostly buys you an obligation." },
    ],
  },
  {
    id: "s4", title: "Dividend cut warning", tag: "Income mechanics",
    setup: "A holding yields 8.4%. Payout ratio is 118% of free cash flow, net debt has risen for three straight years, revenue is flat, and management has publicly promised the dividend is safe.",
    options: [
      { t: "Buy more — 8.4% locked in", s: -3, f: "The yield is high because the market is pricing the cut. Payout above 100% of free cash flow means the dividend is funded by debt." },
      { t: "Sell — the dividend is being funded by borrowing", s: 3, f: "Correct. When the cut comes, you lose the income and roughly 20–40% of the price simultaneously. The cash flow statement outranks management reassurance every time." },
      { t: "Hold and collect the dividend until it is cut", s: -1, f: "You are being paid with your own capital while waiting for a predictable repricing." },
      { t: "Hold but stop reinvesting the dividend", s: 0, f: "Half a decision. You have identified the risk and then chosen not to act on it." },
    ],
  },
  {
    id: "s5", title: "The mania", tag: "Bernstein · Marks",
    setup: "A sector has risen 300% in 18 months. Colleagues at work compare gains daily. Valuations are 60× sales. You own none of it and have underperformed for a year. Your own boring portfolio is up 6%.",
    options: [
      { t: "Buy a small speculative position so you stop feeling left out", s: -2, f: "The stated reason is envy, which is the fourth pillar (psychology) failing. A position taken for emotional reasons will be sold for emotional reasons." },
      { t: "Keep to your written allocation and rebalance as normal", s: 3, f: "Correct. Bernstein’s history pillar exists precisely for this moment. Underperforming a mania is the price of not participating in its unwind." },
      { t: "Short the sector", s: -3, f: "Manias last far longer than your solvency. Being right about valuation and wrong about timing is indistinguishable from being wrong." },
      { t: "Sell your portfolio and rotate fully into the sector", s: -3, f: "Buying peak enthusiasm with everything you own is the textbook mechanism of permanent loss." },
    ],
  },
  {
    id: "s6", title: "The cheap retailer", tag: "Value trap",
    setup: "A retail chain trades at 0.4× book and a P/E of 5. Same-store sales have fallen for nine consecutive quarters, online competitors are taking share, book value is mostly ageing stores on 15-year leases, and net debt is 4× EBITDA.",
    options: [
      { t: "Buy — 60% below book value is a huge margin of safety", s: -3, f: "Book value only protects you if it is realisable. Leased stores and stale inventory are not worth carrying value, and the debt removes any ability to wait." },
      { t: "Avoid — deteriorating earnings plus leverage is a trap, not a discount", s: 3, f: "Correct. The multiple falls as fast as the earnings, so the discount never closes. Graham’s safety needs an asset floor or stable earning power; here there is neither." },
      { t: "Buy a small position as a lottery ticket", s: -1, f: "Deliberate speculation is at least honest, but leverage plus secular decline gives you a lottery ticket with negative expected value." },
      { t: "Wait for a catalyst — new management or a debt restructuring", s: 2, f: "Reasonable discipline. Turnarounds require something to actually change; waiting for the catalyst costs you the first 20% and saves you the previous 60%." },
    ],
  },
  {
    id: "s7", title: "Position size problem", tag: "Estebaranz · risk",
    setup: "Your highest-conviction stock has risen 5× and is now 38% of your portfolio. The thesis is intact, growth is accelerating, but the multiple has expanded from 14× to 41× earnings. This portfolio is also your emergency reserve.",
    options: [
      { t: "Hold everything — never interrupt compounding", s: 0, f: "Defensible for a pure long-horizon book, but you just said this money is also your emergency reserve. Conviction does not pay rent during a 60% drawdown." },
      { t: "Trim to around 20–25% and hold the rest", s: 3, f: "Correct balance. You keep the tail exposure that drives returns while ensuring one repricing cannot end your plan. Size by conviction AND by survivability." },
      { t: "Sell it all and lock in the gain", s: -1, f: "You would be selling a working business for the reason that it worked. Not one of the three valid sell reasons." },
      { t: "Add more — winners keep winning", s: -2, f: "Adding to a 38% position at 41× earnings with no separate reserve is how a single bad quarter resets a decade." },
    ],
  },
  {
    id: "s8", title: "The follow-on", tag: "Angel · sunk cost",
    setup: "A startup you backed 18 months ago at CHF 4m is raising at CHF 16m. Revenue grew from zero to CHF 90k ARR, churn is high, the lead investor is the founder’s uncle, and two of four engineers left. You have pro-rata rights: CHF 8,000 to keep your stake.",
    options: [
      { t: "Exercise pro-rata — protect your ownership", s: -2, f: "Ownership percentage is not the goal; expected value is. High churn, insider-led pricing and engineering departures at a 4× markup means you are paying more for a weaker company." },
      { t: "Pass, and treat the original cheque as sunk", s: 3, f: "Correct. Follow-ons should be earned by evidence, not by loyalty to your earlier decision. The valuation quadrupled while the fundamentals deteriorated." },
      { t: "Double your pro-rata to signal support", s: -3, f: "Averaging up into deteriorating fundamentals with no independent price discovery." },
      { t: "Pass but ask for updated cohort and churn data first", s: 2, f: "Good instinct — always ask. But the answer here is already visible in the departures and the insider-led round." },
    ],
  },
  {
    id: "s9", title: "The windfall", tag: "Housel · Bernstein",
    setup: "You receive CHF 40,000 unexpectedly. Markets are near all-time highs. You have no debt, three months of expenses in cash, and a 25-year horizon.",
    options: [
      { t: "Invest it all immediately into your target allocation", s: 2, f: "Statistically the highest expected value — markets rise more often than they fall, so time in beats timing. The risk is behavioural: a 25% drop next month could break your discipline." },
      { t: "Split across 6–12 months into the target allocation", s: 3, f: "Slightly lower expected return, meaningfully higher probability that you actually stay invested. For a first large sum, the behavioural insurance is worth the small cost." },
      { t: "Hold cash until markets correct", s: -2, f: "All-time highs are the normal state of a rising market. Waiting for a correction has historically cost more than the corrections themselves." },
      { t: "Put it into the highest-yielding stocks you can find", s: -2, f: "Reaching for yield with a windfall is how people end up owning the most fragile balance sheets in the market." },
    ],
  },
  {
    id: "s10", title: "The acquisition", tag: "Lynch · capital allocation",
    setup: "A profitable niche software company you own announces it is buying a chain of fitness studios for 40% of its market cap, funded with new debt. Management calls it a diversification into consumer wellness.",
    options: [
      { t: "Hold — management knows the business better than you", s: -1, f: "Management knows the operations. Capital allocation is a separate skill, and this is the pattern Lynch named diworsification." },
      { t: "Sell — the capital allocation thesis is broken", s: 3, f: "Correct. Your thesis was a focused high-return software business. It just became a levered conglomerate with no synergy. That is a broken thesis, which is reason one to sell." },
      { t: "Buy more on the dip", s: -3, f: "You would be adding to a company that just told you it has run out of high-return ideas in its core." },
      { t: "Hold and watch the integration for two quarters", s: 0, f: "You will learn something, but you are holding through the period when the thesis is most likely to keep degrading." },
    ],
  },
  {
    id: "s11", title: "Index envy", tag: "Bernstein · honesty",
    setup: "Three years into stock picking, your researched portfolio has returned 5.1% per year. The global index returned 9.4%. You spend roughly six hours a week on research.",
    options: [
      { t: "Try harder — increase research hours", s: -1, f: "More effort on an unmeasured process just produces more confident errors. First find out where the gap came from." },
      { t: "Attribute the gap honestly, then move the core to an index and keep a small satellite", s: 3, f: "Correct. Three years is short, but the discipline of benchmarking yourself and acting on the answer is rarer and more valuable than the outperformance itself." },
      { t: "Ignore it — value investing works over decades", s: 0, f: "True, and also the sentence every underperforming investor tells themselves indefinitely. It is only valid if you can name what you got right and wrong." },
      { t: "Switch to a more aggressive strategy to catch up", s: -3, f: "Increasing risk to recover past underperformance is the mechanism behind most blow-ups." },
    ],
  },
  {
    id: "s12", title: "The hot IPO", tag: "Marks · second level",
    setup: "A company you genuinely admire is going public. It grows 45% a year, is loss-making, and prices at 22× sales. Allocation is heavily oversubscribed. Everyone you know is applying.",
    options: [
      { t: "Apply for the maximum allocation", s: -2, f: "IPOs are sold, not bought — the seller has better information and picks the timing. Oversubscription is a fact about enthusiasm, not about value." },
      { t: "Skip it, add to the watchlist, and revisit after two or three reporting cycles", s: 3, f: "Correct. Lock-up expiries and the first earnings misses often reprice these dramatically. You lose nothing by requiring public numbers before you underwrite them." },
      { t: "Buy on the first day of trading", s: -2, f: "You are buying the moment sentiment is at its structural maximum." },
      { t: "Buy a token amount to learn from it", s: 0, f: "Paying tuition is legitimate, but the lesson here is available for free by watching." },
    ],
  },
];

/* ============================================================
   MARKET — approximate real-world seeds, simulated forward
   ============================================================ */
const COMPANIES = [
  { t: "VWRL", n: "FTSE All-World ETF", sec: "Index fund", cat: "Index", p0: 128, eps: 6.4, g: 0.07, dy: 0.017, moat: 3, vol: 0.032, note: "The benchmark. Owning it is the default that your stock picking must beat." },
  { t: "KO", n: "Coca-Cola", sec: "Consumer staples", cat: "Stalwart", p0: 71, eps: 2.95, g: 0.05, dy: 0.029, moat: 5, vol: 0.038, note: "Buffettology archetype: brand, distribution, pricing power, low capital needs." },
  { t: "NESN", n: "Nestlé", sec: "Consumer staples", cat: "Stalwart", p0: 82, eps: 4.6, g: 0.04, dy: 0.035, moat: 4, vol: 0.036, note: "Swiss stalwart. Slow, defensive, dividend-driven total return." },
  { t: "ROG", n: "Roche", sec: "Healthcare", cat: "Stalwart", p0: 268, eps: 17.5, g: 0.04, dy: 0.037, moat: 4, vol: 0.042, note: "Patent cliffs make the growth rate lumpier than it looks." },
  { t: "MSFT", n: "Microsoft", sec: "Software", cat: "Fast grower", p0: 430, eps: 13.1, g: 0.13, dy: 0.007, moat: 5, vol: 0.055, note: "Switching costs plus enterprise lock-in. Rarely statistically cheap." },
  { t: "AAPL", n: "Apple", sec: "Hardware", cat: "Stalwart", p0: 225, eps: 6.9, g: 0.08, dy: 0.005, moat: 5, vol: 0.052, note: "Ecosystem moat and buybacks. Growth now closer to a stalwart." },
  { t: "V", n: "Visa", sec: "Payments", cat: "Fast grower", p0: 290, eps: 10.2, g: 0.11, dy: 0.008, moat: 5, vol: 0.048, note: "Two-sided network, near-zero marginal cost. The moat textbook case." },
  { t: "COST", n: "Costco", sec: "Retail", cat: "Stalwart", p0: 900, eps: 17.5, g: 0.09, dy: 0.005, moat: 4, vol: 0.05, note: "Membership economics. Quality is obvious, which is why it is rarely cheap." },
  { t: "JNJ", n: "Johnson & Johnson", sec: "Healthcare", cat: "Slow grower", p0: 158, eps: 10.1, g: 0.04, dy: 0.031, moat: 4, vol: 0.035, note: "Defensive, litigation-exposed, decades of dividend increases." },
  { t: "NVDA", n: "Nvidia", sec: "Semiconductors", cat: "Fast grower", p0: 118, eps: 2.6, g: 0.22, dy: 0.001, moat: 4, vol: 0.095, note: "Where mania and genuine growth are hardest to separate. Watch the multiple." },
  { t: "ASML", n: "ASML", sec: "Semiconductors", cat: "Cyclical", p0: 720, eps: 20.5, g: 0.14, dy: 0.009, moat: 5, vol: 0.075, note: "Effective monopoly in EUV, but the order book is deeply cyclical." },
  { t: "UBSG", n: "UBS Group", sec: "Banking", cat: "Cyclical", p0: 29, eps: 2.4, g: 0.05, dy: 0.028, moat: 2, vol: 0.06, note: "Banks are leveraged bets on the cycle. Book value matters more than earnings." },
  { t: "XOM", n: "Exxon Mobil", sec: "Energy", cat: "Cyclical", p0: 112, eps: 8.1, g: 0.03, dy: 0.034, moat: 2, vol: 0.062, note: "Commodity business: no pricing power, low P/E at peak earnings is a warning." },
  { t: "F", n: "Ford", sec: "Automotive", cat: "Cyclical", p0: 11, eps: 1.3, g: 0.02, dy: 0.055, moat: 1, vol: 0.07, note: "Capital-intensive, unionised, no pricing power. The commodity archetype." },
  { t: "O", n: "Realty Income", sec: "REIT", cat: "Income", p0: 58, eps: 4.2, g: 0.04, dy: 0.055, moat: 3, vol: 0.04, note: "Monthly dividend REIT. Rate-sensitive; judge on AFFO, not net income." },
  { t: "SCMN", n: "Swisscom", sec: "Telecom", cat: "Slow grower", p0: 520, eps: 33.0, g: 0.02, dy: 0.042, moat: 3, vol: 0.03, note: "Regulated, low growth, high payout. A bond-like equity." },
  { t: "MCY", n: "Meridian Retail", sec: "Retail", cat: "Value trap", p0: 14, eps: 2.4, g: -0.07, dy: 0.09, moat: 0, vol: 0.075, note: "Statistically cheap: P/E under 6, 9% yield. Sales falling, leases heavy, debt 4x EBITDA." },
  { t: "BA", n: "Boeing", sec: "Aerospace", cat: "Turnaround", p0: 175, eps: 7.0, g: 0.11, dy: 0.0, moat: 3, vol: 0.08, note: "Normalised EPS shown, not current depressed earnings. Duopoly with a broken execution record: turnarounds need something to actually change." },
];

const DEAL_TEMPLATES = [
  { n: "Lumen Grid", s: "Energy software", d: "Grid balancing software for municipal utilities. Two paid pilots in Switzerland, CHF 140k ARR, founders ex-Axpo." },
  { n: "Solvent", s: "Fintech", d: "Automated VAT reclaim for SMEs. CHF 30k MRR growing 14% monthly, 3% churn, solo technical founder." },
  { n: "Nocturne Labs", s: "Consumer hardware", d: "Sleep-tracking headband. Crowdfunding raised CHF 400k, no shipped units, 18-month hardware timeline." },
  { n: "Kettle", s: "Marketplace", d: "Marketplace for restaurant surplus. High GMV, 4% take rate, unit economics negative after delivery cost." },
  { n: "Arboria", s: "Climate", d: "Forest carbon measurement via satellite. Two government contracts, long sales cycles, strong science team." },
  { n: "Pallas Health", s: "Healthtech", d: "Triage assistant for GP practices. Regulatory approval pending, 11 pilot clinics, no revenue yet." },
  { n: "Onward Logistics", s: "Logistics", d: "Last-mile routing for Swiss couriers. CHF 220k ARR, 1 customer is 70% of revenue, profitable at current burn." },
  { n: "Vellum", s: "Dev tools", d: "Type-safe API client generation. 9,000 GitHub stars, CHF 6k MRR, founders will not discuss monetisation." },
  { n: "Ferro Additive", s: "Industrial", d: "Metal 3D printing for spare parts. CHF 900k revenue, 22% margins, competes with incumbents on price." },
  { n: "Cadence Rings", s: "Wearables", d: "Privacy-first fitness wearable, no subscription. Pre-launch, 4,000 waitlist signups, hardware unproven." },
];

/* ============================================================
   ENGINE
   ============================================================ */
const fairPE = (c) => Math.max(6, Math.min(45, 7 + c.g * 110 + c.moat * 2.6));
const randn = () => (Math.random() * 2 - 1 + (Math.random() * 2 - 1) + (Math.random() * 2 - 1)) / 1.7;
const fmt = (n, d = 2) =>
  (n === null || n === undefined || isNaN(n)) ? "—" :
  n.toLocaleString("de-CH", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmt0 = (n) => fmt(n, 0);
const pct = (n, d = 1) => `${n >= 0 ? "+" : ""}${fmt(n * 100, d)}%`;

const BUILD = "0.09";        // working toward 1.0; bump on every release
const BUILD_DATE = "12 Aug 2026";

const START_CASH = 100000;
const START_ANGEL = 40000;

function initMarket() {
  const co = {};
  COMPANIES.forEach((c) => {
    const v = c.eps * fairPE(c);
    co[c.t] = { eps: c.eps, sent: c.p0 / v, price: c.p0 };
  });
  return { month: 0, regime: "normal", regimeLeft: 14, co, news: [{ m: 0, t: "Simulation starts. Prices seeded from approximate real-world levels.", k: "info" }] };
}

const NEW_STATE = () => ({
  v: 1, xp: 0, streak: 1, lastDay: new Date().toDateString(),
  done: {}, scen: {}, seen: {}, ses: null,
  mkt: initMarket(),
  pf: { cash: START_CASH, pos: {}, tx: [], hist: [{ m: 0, v: START_CASH }], bench: [{ m: 0, v: START_CASH }] },
  angel: { cash: START_ANGEL, offers: [], holdings: [], nextOffer: 1 },
});

function makeOffer(month) {
  const tpl = DEAL_TEMPLATES[Math.floor(Math.random() * DEAL_TEMPLATES.length)];
  const stages = ["Pre-seed", "Seed", "Seed+"];
  const stage = stages[Math.floor(Math.random() * stages.length)];
  const val = Math.round((1.5 + Math.random() * 14) * 10) / 10;
  const ask = [2000, 3000, 5000, 8000, 12000][Math.floor(Math.random() * 5)];
  const pool = [
    { s: "Founders previously shipped in this exact industry", w: 0.16 },
    { s: "Paying customers who are strangers, not friends", w: 0.20 },
    { s: "Revenue grew >10% month over month for 6 months", w: 0.18 },
    { s: "Founders on below-market salaries, large equity", w: 0.10 },
    { s: "Clean cap table, no dead equity", w: 0.09 },
    { s: "Named lead investor with a track record", w: 0.10 },
    { s: "No revenue after 18 months of building", w: -0.18 },
    { s: "Monthly churn above 8%", w: -0.16 },
    { s: "Two of four engineers left this year", w: -0.13 },
    { s: "70% of revenue from a single customer", w: -0.12 },
    { s: "Round led by a family member of the founder", w: -0.14 },
    { s: "Valuation 4x last round with flat traction", w: -0.15 },
    { s: "No valuation cap on the SAFE", w: -0.11 },
    { s: "Heavy press coverage, no paying users", w: -0.09 },
  ];
  const picks = [];
  const idx = new Set();
  while (picks.length < 4) {
    const i = Math.floor(Math.random() * pool.length);
    if (!idx.has(i)) { idx.add(i); picks.push(pool[i]); }
  }
  const q = Math.max(0.05, Math.min(0.95, 0.45 + picks.reduce((a, b) => a + b.w, 0)));
  return {
    id: `d${month}-${Math.floor(Math.random() * 9999)}`, name: tpl.n, sector: tpl.s, desc: tpl.d,
    stage, val, ask, signals: picks.map((p) => ({ s: p.s, good: p.w > 0 })), q,
    month, expires: month + 3,
  };
}

function stepMarket(st) {
  const s = JSON.parse(JSON.stringify(st));
  const m = s.mkt;
  m.month += 1;
  m.regimeLeft -= 1;
  if (m.regimeLeft <= 0) {
    const r = Math.random();
    m.regime = r < 0.58 ? "normal" : r < 0.82 ? "bull" : "bear";
    m.regimeLeft = 5 + Math.floor(Math.random() * 26);
    m.news.unshift({ m: m.month, k: m.regime, t: m.regime === "bull" ? "Sentiment turns risk-on. Multiples expanding across the market." : m.regime === "bear" ? "Risk-off. Multiples compressing; headlines say this time is different." : "Markets settle into a calmer regime." });
  }
  const drift = m.regime === "bull" ? 0.010 : m.regime === "bear" ? -0.018 : 0.0;

  COMPANIES.forEach((c) => {
    const o = m.co[c.t];
    o.eps = Math.max(0.03, o.eps * (1 + c.g / 12 + randn() * 0.005));
    o.sent = o.sent + (1 - o.sent) * 0.006 + drift + randn() * c.vol;
    o.sent = Math.max(0.22, Math.min(3.2, o.sent));
    o.price = Math.max(0.4, o.eps * fairPE(c) * o.sent);
  });

  // quarterly: earnings surprises + dividends
  if (m.month % 3 === 0) {
    COMPANIES.forEach((c) => {
      const o = m.co[c.t];
      if (Math.random() < 0.22) {
        const beat = Math.random() < 0.5;
        const size = 0.03 + Math.random() * 0.11;
        o.sent *= beat ? 1 + size : 1 - size;
        m.news.unshift({ m: m.month, k: beat ? "good" : "bad", t: `${c.n} (${c.t}) ${beat ? "beats" : "misses"} estimates. Shares move ${beat ? "+" : "−"}${(size * 100).toFixed(0)}% on the print.` });
      }
      const sh = s.pf.pos[c.t]?.sh || 0;
      if (sh > 0 && c.dy > 0) {
        const dps = (c.p0 * c.dy / 4) * (o.eps / c.eps);
        const cash = sh * dps;
        if (cash > 0.01) {
          s.pf.cash += cash;
          s.pf.tx.unshift({ m: m.month, k: "div", t: c.t, sh, px: dps, amt: cash });
        }
      }
    });
  }

  // angel deal flow
  if (m.month >= s.angel.nextOffer) {
    s.angel.offers = s.angel.offers.filter((o) => o.expires > m.month);
    if (s.angel.offers.length < 3) s.angel.offers.push(makeOffer(m.month));
    s.angel.nextOffer = m.month + 4 + Math.floor(Math.random() * 4);
  }
  s.angel.offers = s.angel.offers.filter((o) => o.expires > m.month);

  // resolve angel holdings
  s.angel.holdings = s.angel.holdings.map((h) => {
    if (h.status !== "active") return h;
    let nh = { ...h };
    if ((m.month - h.month) > 0 && (m.month - h.month) % 18 === 0) {
      nh.own = nh.own * 0.82;
      nh.rounds = (nh.rounds || 0) + 1;
    }
    if (m.month >= h.resolve) {
      const r = Math.random();
      const pZero = Math.max(0.15, 0.66 - 0.4 * h.q);
      let mult = 0;
      if (r < pZero) mult = 0;
      else if (r < pZero + 0.22) mult = 0.3 + Math.random() * 0.9;
      else if (r < pZero + 0.40) mult = 1.5 + Math.random() * 2.5;
      else if (r < pZero + 0.53) mult = 4 + Math.random() * 8;
      else mult = 14 + Math.random() * (40 + 60 * h.q);
      const dilutionDrag = nh.own / h.own0;
      const proceeds = h.amt * mult * dilutionDrag;
      nh.status = mult === 0 ? "failed" : "exited";
      nh.mult = mult * dilutionDrag;
      nh.proceeds = proceeds;
      s.angel.cash += proceeds;
      m.news.unshift({ m: m.month, k: mult === 0 ? "bad" : "good", t: mult === 0 ? `${h.name} shut down. Your CHF ${fmt0(h.amt)} is written off.` : `${h.name} exits. Your stake returns CHF ${fmt0(proceeds)} (${mult.toFixed(1)}x before dilution).` });
    }
    return nh;
  });

  // record net worth + benchmark
  const eq = Object.entries(s.pf.pos).reduce((a, [t, p]) => a + p.sh * m.co[t].price, 0);
  const angelBook = s.angel.holdings.filter((h) => h.status === "active").reduce((a, h) => a + h.amt, 0);
  s.pf.hist.push({ m: m.month, v: s.pf.cash + eq + s.angel.cash + angelBook });
  const b0 = COMPANIES.find((c) => c.t === "VWRL");
  const bIdx = m.co.VWRL.price / b0.p0;
  s.pf.bench.push({ m: m.month, v: (START_CASH + START_ANGEL) * bIdx });
  m.news = m.news.slice(0, 60);
  return s;
}

/* ============================================================
   UI PRIMITIVES
   ============================================================ */
const Panel = ({ children, style, className = "" }) => (
  <div className={`rounded-lg ${className}`} style={{ background: C.surface, border: `1px solid ${C.line}`, ...style }}>{children}</div>
);

const Btn = ({ children, onClick, kind = "ghost", disabled, className = "", small }) => {
  const base = { border: `1px solid ${C.line}`, color: C.text, background: "transparent" };
  const styles = {
    primary: { background: C.brass, color: "#12181F", border: `1px solid ${C.brass}`, fontWeight: 600 },
    danger: { background: "transparent", color: C.loss, border: `1px solid ${C.loss}` },
    ghost: base,
    solid: { background: C.surface2, color: C.text, border: `1px solid ${C.line}` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-md transition-opacity ${small ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm"} ${disabled ? "opacity-40" : "hover:opacity-80"} ${className}`}
      style={styles[kind]}>{children}</button>
  );
};

const Eyebrow = ({ children }) => (
  <div className="uppercase tracking-widest mb-2" style={{ fontFamily: mono, fontSize: 10, color: C.dim, letterSpacing: "0.14em" }}>{children}</div>
);

/* ------------------------------------------------------------
   Glossary: auto-detect known terms in any body text and make
   them tappable. Longest terms match first so "book value per
   share" wins over "book value".
   ------------------------------------------------------------ */

/* ------------------------------------------------------------
   Library: every term, grouped. Acronyms are flagged separately
   because they are the ones people forget.
   ------------------------------------------------------------ */
const CATEGORIES = [
  { n: "Valuation & price", k: ["P/E", "PEG", "P/B", "book value", "book value per share", "intrinsic value", "discount to value", "margin of safety", "DCF", "discount rate", "WACC", "terminal value", "Graham number", "market cap"] },
  { n: "Company health", k: ["EPS", "net income", "revenue", "EBITDA", "free cash flow", "owner earnings", "capex", "maintenance capex", "D&A", "working capital", "net debt", "net debt/EBITDA", "leverage", "debt/equity", "ROE", "moat", "buyback", "shares outstanding"] },
  { n: "Income & dividends", k: ["dividend", "dividend yield", "payout ratio", "yield on cost", "total return", "REIT"] },
  { n: "Growth & compounding", k: ["compounding", "CAGR", "rule of 72"] },
  { n: "Risk & portfolio", k: ["risk", "volatility", "drawdown", "diversification", "asset allocation", "rebalancing", "position sizing", "benchmark", "index fund", "ETF", "accumulating", "TER", "dry powder", "liquidity", "Mr. Market", "second-level thinking"] },
  { n: "Lynch's company types", k: ["cyclical", "stalwart", "fast grower", "turnaround", "asset play", "value trap", "tenbagger", "diworsification"] },
  { n: "Startups & angel investing", k: ["pre-money", "dilution", "SAFE", "valuation cap", "pro-rata", "cap table", "ARR", "churn", "burn rate", "power law", "unit economics", "GMV"] },
  { n: "Swiss tax & costs", k: ["stamp duty", "withholding tax", "Säule 3a", "capital gains", "professional securities dealer"] },
];
const IS_ACRONYM = (k) => /^[A-Z0-9&\/]{2,7}$/.test(k) || k === "net debt/EBITDA" || k === "Säule 3a";
const CATEGORISED = new Set(CATEGORIES.flatMap((c) => c.k));
const UNCATEGORISED = Object.keys(GLOSSARY).filter((k) => !CATEGORISED.has(k));

const TermCtx = React.createContext(() => {});
const esc = (x) => x.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&");
const LOOKUP = (() => {
  const map = {};
  Object.keys(GLOSSARY).forEach((k) => { map[k.toLowerCase()] = k; });
  Object.entries(ALIASES).forEach(([a, k]) => { if (GLOSSARY[k]) map[a.toLowerCase()] = k; });
  return map;
})();
const TERM_RE = new RegExp(
  "(" + Object.keys(LOOKUP).sort((a, b) => b.length - a.length).map(esc).join("|") + ")",
  "gi"
);
const isWordChar = (ch) => !!ch && /[A-Za-zÀ-ÿ0-9]/.test(ch);

function Rich({ children }) {
  const open = React.useContext(TermCtx);
  const text = typeof children === "string" ? children : "";
  if (!text) return children || null;

  const out = [];
  const seen = new Set();
  let last = 0;
  TERM_RE.lastIndex = 0;
  let mt;
  while ((mt = TERM_RE.exec(text)) !== null) {
    const start = mt.index, end = start + mt[0].length;
    // require whole-word boundaries so "cap" doesn't match inside "capital"
    if (isWordChar(text[start - 1]) || isWordChar(text[end])) continue;
    const key = LOOKUP[mt[0].toLowerCase()];
    if (!key || seen.has(key)) continue;   // link only the first mention per block
    // acronyms must match case: "the dividend is safe" is not a SAFE note
    if (/^[A-Z0-9&\/\-]{2,6}$/.test(key) && mt[0].toLowerCase() === key.toLowerCase() && mt[0] !== key) continue;
    seen.add(key);
    if (start > last) out.push(text.slice(last, start));
    const label = mt[0];
    out.push(
      <span key={`${key}-${start}`} role="button" tabIndex={0}
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); open(key); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); open(key); } }}
        style={{ color: C.brass, borderBottom: `1px dotted ${C.brass}`, cursor: "pointer" }}>
        {label}
      </span>
    );
    last = end;
  }
  if (!out.length) return text;
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

function detectTerms(text) {
  const out = []; const seen = new Set();
  if (!text) return out;
  TERM_RE.lastIndex = 0;
  let mt;
  while ((mt = TERM_RE.exec(text)) !== null) {
    const start = mt.index, end = start + mt[0].length;
    if (isWordChar(text[start - 1]) || isWordChar(text[end])) continue;
    const key = LOOKUP[mt[0].toLowerCase()];
    if (!key || seen.has(key)) continue;
    if (/^[A-Z0-9&\/\-]{2,6}$/.test(key) && mt[0].toLowerCase() === key.toLowerCase() && mt[0] !== key) continue;
    seen.add(key); out.push(key);
  }
  // terms carrying a formula are the useful hints
  return out.sort((a, b) => (GLOSSARY[b].f ? 1 : 0) - (GLOSSARY[a].f ? 1 : 0));
}

function TermSheet({ termKey, onClose, onOpen }) {
  const g = GLOSSARY[termKey];
  if (!g) return null;
  // other terms mentioned inside this definition, for quick hopping
  const body = [g.d, g.f, g.ex, g.w].filter(Boolean).join(" ");
  const related = Object.keys(GLOSSARY).filter((k) => {
    if (k === termKey) return false;
    return new RegExp(`(^|[^A-Za-zÀ-ÿ0-9])${esc(k)}([^A-Za-zÀ-ÿ0-9]|$)`, "i").test(body);
  }).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(5,8,12,.75)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl p-5"
        style={{ background: C.surface, border: `1px solid ${C.line}`, maxHeight: "88vh", overflowY: "auto", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <Eyebrow>In plain language</Eyebrow>
            <h3 style={{ fontFamily: serif, fontSize: 21, lineHeight: 1.2 }}>{g.t}</h3>
          </div>
          <button onClick={onClose} style={{ color: C.dim }} aria-label="Close"><X size={20} /></button>
        </div>

        <p style={{ fontSize: 15, lineHeight: 1.65, opacity: 0.9 }}>{g.d}</p>

        {g.f && (
          <div className="mt-3 px-3 py-3 rounded" style={{ background: C.bg, border: `1px solid ${C.line}` }}>
            <Num size={9} color={C.dim}>FORMULA</Num>
            <div style={{ fontFamily: mono, fontSize: 13.5, color: C.brass, lineHeight: 1.5, marginTop: 4 }}>{g.f}</div>
          </div>
        )}

        {g.ex && (
          <div className="mt-3 px-3 py-3 rounded" style={{ background: C.surface2 }}>
            <Num size={9} color={C.dim}>EXAMPLE</Num>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 4, opacity: 0.9 }}>{g.ex}</p>
          </div>
        )}

        {g.w && (
          <div className="mt-3 px-3 py-3 rounded" style={{ background: C.surface2, borderLeft: `2px solid ${C.brass}` }}>
            <Num size={9} color={C.dim}>WHY IT MATTERS</Num>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 4, opacity: 0.9 }}>{g.w}</p>
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-4">
            <Num size={9} color={C.dim}>RELATED</Num>
            <div className="flex gap-2 mt-2" style={{ flexWrap: "wrap" }}>
              {related.map((r) => (
                <button key={r} onClick={() => onOpen(r)} className="px-3 py-1.5 rounded-full"
                  style={{ fontSize: 12, background: C.surface2, border: `1px solid ${C.line}`, color: C.text }}>
                  {GLOSSARY[r].t.split(" (")[0]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GlossaryBrowser({ onClose, onOpen }) {
  const [q, setQ] = useState("");
  const keys = Object.keys(GLOSSARY).sort((a, b) => GLOSSARY[a].t.localeCompare(GLOSSARY[b].t));
  const hits = keys.filter((k) => {
    if (!q.trim()) return true;
    const n = q.toLowerCase();
    return k.toLowerCase().includes(n) || GLOSSARY[k].t.toLowerCase().includes(n) || GLOSSARY[k].d.toLowerCase().includes(n);
  });
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(5,8,12,.75)" }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl p-5"
        style={{ background: C.surface, border: `1px solid ${C.line}`, maxHeight: "88vh", overflowY: "auto", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <Eyebrow>{keys.length} terms</Eyebrow>
            <h3 style={{ fontFamily: serif, fontSize: 21 }}>Glossary</h3>
          </div>
          <button onClick={onClose} style={{ color: C.dim }} aria-label="Close"><X size={20} /></button>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a term"
          className="px-3 py-2 rounded-md w-full outline-none mb-3"
          style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.text, fontSize: 14 }} />
        {hits.length === 0 && <p style={{ fontSize: 13, color: C.dim }}>Nothing matches that. Try a shorter word.</p>}
        {hits.map((k, i) => (
          <button key={k} onClick={() => onOpen(k)} className="w-full text-left py-3"
            style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <div style={{ fontSize: 14.5 }}>{GLOSSARY[k].t}</div>
            <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.45, marginTop: 2 }}>
              {GLOSSARY[k].d.length > 90 ? GLOSSARY[k].d.slice(0, 90) + "…" : GLOSSARY[k].d}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const Num = ({ children, color, size = 14, weight = 500 }) => (
  <span style={{ fontFamily: mono, color: color || C.text, fontSize: size, fontWeight: weight, fontVariantNumeric: "tabular-nums" }}>{children}</span>
);

/* ============================================================
   LESSON PLAYER
   ============================================================ */
function LessonView({ lesson, ses, setSes, onDone, onExit }) {
  const unit = UNITS.find((u) => u.id === lesson.unit);
  const q = lesson.quiz[ses.qi];
  const upd = (patch) => setSes({ ...ses, ...patch });

  const XP_FULL = 12, XP_HINTED = 5;
  const hintKeys = q ? detectTerms(q.q) : [];
  const usedHint = !!ses.hints[ses.qi];

  const isRight = () => {
    if (!q) return false;
    if (q.type === "mc") return ses.pick === q.a;
    if (q.type === "tf") return ses.pick === (q.a ? 0 : 1);
    const v = parseFloat(String(ses.txt).replace(/[',\s]/g, ""));
    return !isNaN(v) && Math.abs(v - q.a) <= (q.tol ?? 0.01);
  };

  const check = () => {
    if (ses.checked) {
      const nq = ses.qi + 1;
      if (nq >= lesson.quiz.length) { onDone(ses.correct, lesson.quiz.length, ses.earned, Object.keys(ses.hints).length); return; }
      upd({ qi: nq, pick: null, txt: "", checked: false });
    } else {
      const right = isRight();
      upd({
        checked: true,
        correct: ses.correct + (right ? 1 : 0),
        earned: ses.earned + (right ? (usedHint ? XP_HINTED : XP_FULL) : 0),
      });
    }
  };

  const total = lesson.cards.length + lesson.quiz.length;
  const at = ses.phase === "cards" ? ses.i : lesson.cards.length + ses.qi;

  return (
    <div className="pb-28">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onExit} style={{ color: C.dim }} aria-label="Leave lesson"><ChevronLeft size={20} /></button>
        <div className="flex-1 h-1 rounded" style={{ background: C.line }}>
          <div className="h-1 rounded" style={{ width: `${((at + 1) / total) * 100}%`, background: unit.color, transition: "width .3s" }} />
        </div>
        <Num size={11} color={C.dim}>{at + 1}/{total}</Num>
      </div>

      {ses.phase === "cards" ? (
        <div>
          <Eyebrow>{unit.name} · {unit.source}</Eyebrow>
          <Panel className="p-5">
            <h3 className="mb-3" style={{ fontFamily: serif, fontSize: 22, lineHeight: 1.25 }}>{lesson.cards[ses.i].h}</h3>
            <p style={{ color: C.text, opacity: 0.85, fontSize: 15, lineHeight: 1.65 }}><Rich>{lesson.cards[ses.i].p}</Rich></p>
          </Panel>
          <div className="flex gap-2 mt-4">
            {ses.i > 0 && <Btn onClick={() => upd({ i: ses.i - 1 })}>Back</Btn>}
            <Btn kind="primary" className="flex-1"
              onClick={() => ses.i + 1 < lesson.cards.length ? upd({ i: ses.i + 1 }) : upd({ phase: "quiz" })}>
              {ses.i + 1 < lesson.cards.length ? "Next" : "Start questions"}
            </Btn>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-2">
            <Eyebrow>Question {ses.qi + 1} of {lesson.quiz.length}</Eyebrow>
            <Num size={10} color={usedHint ? C.dim : C.brass}>{usedHint ? `${XP_HINTED} XP` : `${XP_FULL} XP`}</Num>
          </div>
          <Panel className="p-5">
            <p className="mb-4" style={{ fontSize: 16, lineHeight: 1.5 }}>{q.q}</p>
            {q.type === "num" ? (
              <div className="flex items-center gap-2">
                <input value={ses.txt} onChange={(e) => upd({ txt: e.target.value })} inputMode="decimal" placeholder="Your answer"
                  disabled={ses.checked}
                  className="px-3 py-2 rounded-md w-40 outline-none"
                  style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.text, fontFamily: mono }} />
                {q.unit && <Num color={C.dim}>{q.unit}</Num>}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {(q.type === "tf" ? ["True", "False"] : q.options).map((o, k) => {
                  const sel = ses.pick === k;
                  const right = q.type === "tf" ? (q.a ? 0 : 1) === k : q.a === k;
                  let bg = C.surface2, bd = C.line;
                  if (ses.checked && right) { bg = "rgba(63,169,122,.15)"; bd = C.gain; }
                  else if (ses.checked && sel && !right) { bg = "rgba(208,106,90,.15)"; bd = C.loss; }
                  else if (sel) { bd = unit.color; }
                  return (
                    <button key={k} disabled={ses.checked} onClick={() => upd({ pick: k })}
                      className="text-left px-4 py-3 rounded-md text-sm"
                      style={{ background: bg, border: `1px solid ${bd}`, color: C.text, lineHeight: 1.4 }}>
                      <Rich>{o}</Rich>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          {!ses.checked && hintKeys.length > 0 && !usedHint && (
            <button onClick={() => upd({ hints: { ...ses.hints, [ses.qi]: true } })}
              className="w-full mt-3 px-4 py-2 rounded-md flex items-center justify-center gap-2"
              style={{ border: `1px dashed ${C.line}`, color: C.dim, fontSize: 13 }}>
              <Lightbulb size={14} /> Show a hint ({XP_FULL} XP → {XP_HINTED} XP)
            </button>
          )}

          {usedHint && !ses.checked && (
            <Panel className="p-4 mt-3" style={{ borderColor: C.brass }}>
              <Num size={10} color={C.brass}>HINT</Num>
              {hintKeys.slice(0, 2).map((k) => (
                <div key={k} className="mt-2">
                  <div style={{ fontSize: 13.5 }}>{GLOSSARY[k].t}</div>
                  {GLOSSARY[k].f
                    ? <div style={{ fontFamily: mono, fontSize: 13, color: C.brass, marginTop: 3 }}>{GLOSSARY[k].f}</div>
                    : <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5, marginTop: 3 }}>{GLOSSARY[k].d}</div>}
                </div>
              ))}
              <p className="mt-3" style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>
                You still have to do the work. This question is now worth {XP_HINTED} XP instead of {XP_FULL}.
              </p>
            </Panel>
          )}

          {ses.checked && (
            <Panel className="p-4 mt-3" style={{ borderColor: isRight() ? C.gain : C.loss }}>
              <div className="flex items-center gap-2 mb-2">
                {isRight() ? <Check size={16} color={C.gain} /> : <X size={16} color={C.loss} />}
                <Num color={isRight() ? C.gain : C.loss} size={12}>
                  {isRight() ? (usedHint ? `CORRECT · +${XP_HINTED} XP` : `CORRECT · +${XP_FULL} XP`)
                             : `ANSWER: ${q.type === "num" ? fmt(q.a, q.a % 1 ? 2 : 0) + (q.unit ? " " + q.unit : "") : q.type === "tf" ? (q.a ? "True" : "False") : q.options[q.a]}`}
                </Num>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.85 }}><Rich>{q.why}</Rich></p>
            </Panel>
          )}

          <Btn kind="primary" className="w-full mt-4" onClick={check}
            disabled={!ses.checked && ses.pick === null && ses.txt === ""}>
            {ses.checked ? (ses.qi + 1 >= lesson.quiz.length ? "Finish lesson" : "Continue") : "Check"}
          </Btn>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LEARN TAB
   ============================================================ */
function LearnTab({ st, setSt }) {
  const idx = (id) => LESSONS.findIndex((l) => l.id === id);
  const unlocked = (l) => { const k = idx(l.id); return k === 0 || !!st.done[LESSONS[k - 1].id]; };
  const ses = st.ses;

  const openLesson = (id) => setSt((x) => ({
    ...x, ses: { id, i: 0, phase: "cards", qi: 0, pick: null, txt: "", checked: false, correct: 0, earned: 0, hints: {} },
  }));
  const setSes = (next) => setSt((x) => ({ ...x, ses: next }));
  const closeLesson = () => setSt((x) => ({ ...x, ses: null }));

  if (ses && LESSONS.some((l) => l.id === ses.id)) {
    const lesson = LESSONS.find((l) => l.id === ses.id);
    return <LessonView lesson={lesson} ses={ses} setSes={setSes} onExit={closeLesson}
      onDone={(c, t, earned, hints) => setSt((x) => ({
        ...x, xp: x.xp + earned, ses: null,
        done: { ...x.done, [lesson.id]: { c, t, h: hints } },
      }))} />;
  }

  return (
    <div className="pb-28">
      <Eyebrow>Curriculum · 20 lessons from 11 books</Eyebrow>
      <h2 className="mb-1" style={{ fontFamily: serif, fontSize: 26 }}>The path</h2>
      <p className="mb-5" style={{ color: C.dim, fontSize: 13, lineHeight: 1.5 }}>
        Each unit is one book’s core argument, compressed to what changes a decision. Finish a lesson to unlock the next.
      </p>
      {UNITS.map((u) => {
        const ls = LESSONS.filter((l) => l.unit === u.id);
        const doneCount = ls.filter((l) => st.done[l.id]).length;
        return (
          <div key={u.id} className="mb-5">
            <div className="flex items-baseline gap-2 mb-2">
              <Num size={11} color={u.color}>{String(u.id).padStart(2, "0")}</Num>
              <span style={{ fontFamily: serif, fontSize: 17 }}>{u.name}</span>
              <Num size={10} color={C.dim}>{doneCount}/{ls.length}</Num>
            </div>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 8, fontFamily: mono }}>{u.source}</div>
            <div className="flex flex-col gap-2">
              {ls.map((l) => {
                const d = st.done[l.id];
                const open = unlocked(l);
                return (
                  <button key={l.id} disabled={!open} onClick={() => openLesson(l.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-left"
                    style={{ background: C.surface, border: `1px solid ${d ? u.color : C.line}`, opacity: open ? 1 : 0.4 }}>
                    <div className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: d ? u.color : C.surface2, color: d ? "#12181F" : C.dim, flexShrink: 0 }}>
                      {d ? <Check size={15} /> : open ? <Play size={13} /> : <Lock size={13} />}
                    </div>
                    <div className="flex-1">
                      <div style={{ fontSize: 14 }}>{l.title}</div>
                      {d && <Num size={10} color={C.dim}>{d.c}/{d.t} correct{d.h ? ` · ${d.h} hint${d.h > 1 ? "s" : ""}` : ""}</Num>}
                    </div>
                    <ChevronRight size={16} color={C.dim} />
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   SCENARIOS TAB
   ============================================================ */
function ScenarioTab({ st, setSt }) {
  const [open, setOpen] = useState(null);
  const [pick, setPick] = useState(null);
  const sc = SCENARIOS.find((s) => s.id === open);

  if (sc) {
    return (
      <div className="pb-28">
        <button onClick={() => { setOpen(null); setPick(null); }} className="mb-4 flex items-center gap-1" style={{ color: C.dim, fontSize: 13 }}>
          <ChevronLeft size={16} /> All scenarios
        </button>
        <Eyebrow>{sc.tag}</Eyebrow>
        <h2 className="mb-3" style={{ fontFamily: serif, fontSize: 24 }}>{sc.title}</h2>
        <Panel className="p-4 mb-4">
          <p style={{ fontSize: 15, lineHeight: 1.65, opacity: 0.9 }}><Rich>{sc.setup}</Rich></p>
        </Panel>
        <div className="flex flex-col gap-2">
          {sc.options.map((o, k) => {
            const chosen = pick === k;
            const show = pick !== null;
            const good = o.s >= 3;
            let bd = C.line;
            if (show && good) bd = C.gain;
            else if (show && chosen) bd = o.s > 0 ? C.brass : C.loss;
            return (
              <div key={k}>
                <button disabled={show} onClick={() => {
                  setPick(k);
                  setSt((s) => ({ ...s, xp: s.xp + Math.max(0, o.s) * 15, scen: { ...s.scen, [sc.id]: o.s } }));
                }}
                  className="w-full text-left px-4 py-3 rounded-md text-sm"
                  style={{ background: C.surface, border: `1px solid ${bd}`, color: C.text, lineHeight: 1.45 }}>
                  <div className="flex items-start gap-2">
                    <span className="flex-1"><Rich>{o.t}</Rich></span>
                    {show && <Num size={11} color={o.s > 0 ? C.gain : o.s === 0 ? C.dim : C.loss}>{o.s > 0 ? "+" : ""}{o.s}</Num>}
                  </div>
                </button>
                {show && chosen && (
                  <div className="px-4 py-3 mt-1 rounded-md" style={{ background: C.surface2, border: `1px solid ${C.line}`, fontSize: 13.5, lineHeight: 1.6, opacity: 0.9 }}>
                    <Rich>{o.f}</Rich>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {pick !== null && (
          <div className="mt-4">
            {sc.options[pick].s < 3 && (
              <Panel className="p-4 mb-3" style={{ borderColor: C.gain }}>
                <Num size={11} color={C.gain}>BEST ANSWER</Num>
                <p className="mt-2" style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.9 }}>
                  <Rich>{`${sc.options.find((o) => o.s >= 3)?.t} — ${sc.options.find((o) => o.s >= 3)?.f}`}</Rich>
                </p>
              </Panel>
            )}
            <Btn kind="primary" className="w-full" onClick={() => { setOpen(null); setPick(null); }}>Back to scenarios</Btn>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pb-28">
      <Eyebrow>Decision training · 12 situations</Eyebrow>
      <h2 className="mb-1" style={{ fontFamily: serif, fontSize: 26 }}>Scenarios</h2>
      <p className="mb-5" style={{ color: C.dim, fontSize: 13, lineHeight: 1.5 }}>
        Knowing the theory is not the skill. The skill is choosing correctly when the situation is uncomfortable and the crowd disagrees.
      </p>
      <div className="flex flex-col gap-2">
        {SCENARIOS.map((s) => {
          const score = st.scen[s.id];
          return (
            <button key={s.id} onClick={() => setOpen(s.id)} className="px-4 py-3 rounded-lg text-left"
              style={{ background: C.surface, border: `1px solid ${score !== undefined ? (score >= 3 ? C.gain : score > 0 ? C.brass : C.loss) : C.line}` }}>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div style={{ fontSize: 14.5 }}>{s.title}</div>
                  <Num size={10} color={C.dim}>{s.tag}</Num>
                </div>
                {score !== undefined && <Num size={12} color={score >= 3 ? C.gain : score > 0 ? C.brass : C.loss}>{score > 0 ? "+" : ""}{score}</Num>}
                <ChevronRight size={15} color={C.dim} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   PORTFOLIO TAB
   ============================================================ */
function PortfolioTab({ st, setSt, advance, running }) {
  const [sel, setSel] = useState(null);
  const [qty, setQty] = useState("");
  const m = st.mkt;
  const valueLens = LESSONS.filter((l) => l.unit === 5).some((l) => st.done[l.id]);
  const eq = Object.entries(st.pf.pos).reduce((a, [t, p]) => a + p.sh * m.co[t].price, 0);
  const angelActive = st.angel.holdings.filter((h) => h.status === "active").reduce((a, h) => a + h.amt, 0);
  const nw = st.pf.cash + eq + st.angel.cash + angelActive;
  const start = START_CASH + START_ANGEL;
  const years = m.month / 12;
  const cagr = years > 0.4 ? Math.pow(nw / start, 1 / years) - 1 : null;
  const bench = st.pf.bench[st.pf.bench.length - 1]?.v || start;
  const bCagr = years > 0.4 ? Math.pow(bench / start, 1 / years) - 1 : null;

  const chartData = st.pf.hist.map((h, i) => ({ m: h.m, You: Math.round(h.v), Index: Math.round(st.pf.bench[i]?.v || start) }));

  const trade = (dir) => {
    const c = COMPANIES.find((x) => x.t === sel);
    const px = m.co[sel].price;
    const n = Math.floor(parseFloat(qty) || 0);
    if (n <= 0) return;
    setSt((s) => {
      const p = { ...s.pf };
      const pos = { ...p.pos };
      if (dir === "buy") {
        const cost = n * px;
        if (cost > p.cash) return s;
        const old = pos[sel] || { sh: 0, cost: 0 };
        pos[sel] = { sh: old.sh + n, cost: old.cost + cost };
        p.cash -= cost;
      } else {
        const old = pos[sel];
        if (!old || old.sh < n) return s;
        const avg = old.cost / old.sh;
        pos[sel] = { sh: old.sh - n, cost: old.cost - avg * n };
        if (pos[sel].sh <= 0) delete pos[sel];
        p.cash += n * px;
      }
      p.pos = pos;
      p.tx = [{ m: m.month, k: dir, t: sel, sh: n, px, amt: n * px }, ...p.tx].slice(0, 200);
      return { ...s, pf: p };
    });
    setQty("");
  };

  const co = sel ? COMPANIES.find((x) => x.t === sel) : null;
  const live = sel ? m.co[sel] : null;
  const iv = co ? live.eps * fairPE(co) : 0;

  return (
    <div className="pb-28">
      <Panel className="p-4 mb-3">
        <div className="flex justify-between items-start mb-3">
          <div>
            <Eyebrow>Net worth · month {m.month}</Eyebrow>
            <Num size={28} weight={600}>CHF {fmt0(nw)}</Num>
            <div className="mt-1 flex items-center gap-3">
              <Num size={12} color={nw >= start ? C.gain : C.loss}>{pct(nw / start - 1)} total</Num>
              {cagr !== null && <Num size={12} color={C.dim}>{pct(cagr)} p.a.</Num>}
            </div>
          </div>
          <div className="text-right">
            <Num size={10} color={C.dim}>REGIME</Num>
            <div style={{ fontFamily: mono, fontSize: 13, color: m.regime === "bull" ? C.gain : m.regime === "bear" ? C.loss : C.dim, textTransform: "uppercase" }}>{m.regime}</div>
          </div>
        </div>

        <div style={{ height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={C.line} vertical={false} />
              <XAxis dataKey="m" tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.dim, fontSize: 10 }} axisLine={false} tickLine={false} width={44} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip contentStyle={{ background: C.surface2, border: `1px solid ${C.line}`, borderRadius: 6, fontSize: 12 }} labelFormatter={(v) => `Month ${v}`} formatter={(v) => `CHF ${fmt0(v)}`} />
              <Line type="monotone" dataKey="You" stroke={C.brass} dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="Index" stroke={C.dim} dot={false} strokeWidth={1} strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {bCagr !== null && (
          <div className="mt-2 px-3 py-2 rounded" style={{ background: C.surface2, fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
            Global index over the same period: <Num size={12} color={C.text}>{pct(bCagr)} p.a.</Num>{" "}
            {cagr > bCagr ? "You are ahead — check whether it came from skill or from one lucky position." : "You are behind the index. That is the benchmark that matters."}
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <Btn onClick={() => advance(1)} disabled={running} className="flex-1"><span className="flex items-center justify-center gap-1"><Play size={13} /> 1 month</span></Btn>
          <Btn onClick={() => advance(12)} disabled={running} className="flex-1"><span className="flex items-center justify-center gap-1"><FastForward size={13} /> 1 year</span></Btn>
          <Btn onClick={() => advance(60)} disabled={running} className="flex-1"><span className="flex items-center justify-center gap-1"><FastForward size={13} /> 5 years</span></Btn>
        </div>
        <div className="flex justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${C.line}` }}>
          <div><Num size={10} color={C.dim}>CASH</Num><div><Num size={14}>{fmt0(st.pf.cash)}</Num></div></div>
          <div><Num size={10} color={C.dim}>EQUITIES</Num><div><Num size={14}>{fmt0(eq)}</Num></div></div>
          <div><Num size={10} color={C.dim}>ANGEL BOOK</Num><div><Num size={14}>{fmt0(angelActive + st.angel.cash)}</Num></div></div>
        </div>
      </Panel>

      {Object.keys(st.pf.pos).length > 0 && (
        <div className="mb-3">
          <Eyebrow>Holdings</Eyebrow>
          <Panel>
            {Object.entries(st.pf.pos).map(([t, p], i) => {
              const c = COMPANIES.find((x) => x.t === t);
              const px = m.co[t].price;
              const val = p.sh * px;
              const gl = val - p.cost;
              const w = val / eq;
              return (
                <button key={t} onClick={() => setSel(t)} className="w-full flex items-center px-4 py-3 text-left" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                  <div className="flex-1">
                    <Num size={13} weight={600}>{t}</Num>
                    <div><Num size={10} color={C.dim}>{fmt0(p.sh)} sh · {fmt(w * 100, 0)}% of equities</Num></div>
                  </div>
                  <div className="text-right">
                    <Num size={13}>{fmt0(val)}</Num>
                    <div><Num size={11} color={gl >= 0 ? C.gain : C.loss}>{pct(gl / p.cost)}</Num></div>
                  </div>
                </button>
              );
            })}
          </Panel>
        </div>
      )}

      <Eyebrow>Market</Eyebrow>
      <Panel className="mb-3">
        {COMPANIES.map((c, i) => {
          const px = m.co[c.t].price;
          const pe = px / m.co[c.t].eps;
          const chg = px / c.p0 - 1;
          return (
            <button key={c.t} onClick={() => setSel(c.t)} className="w-full flex items-center px-4 py-3 text-left" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Num size={13} weight={600}>{c.t}</Num>
                  <span style={{ fontSize: 12, color: C.dim }}>{c.n}</span>
                </div>
                <Num size={10} color={C.dim}>{c.cat} · P/E {fmt(pe, 1)}{c.dy > 0 ? ` · yield ${fmt(c.dy * 100, 1)}%` : ""}</Num>
              </div>
              <div className="text-right">
                <Num size={13}>{fmt(px, 2)}</Num>
                <div><Num size={10} color={chg >= 0 ? C.gain : C.loss}>{pct(chg, 0)}</Num></div>
              </div>
            </button>
          );
        })}
      </Panel>

      <Eyebrow>News tape</Eyebrow>
      <Panel className="p-3 mb-3" style={{ maxHeight: 220, overflowY: "auto" }}>
        {m.news.slice(0, 18).map((n, i) => (
          <div key={i} className="flex gap-2 py-1.5" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <Num size={10} color={C.dim}>M{String(n.m).padStart(3, "0")}</Num>
            <span style={{ fontSize: 12.5, lineHeight: 1.45, color: n.k === "good" ? C.gain : n.k === "bad" ? C.loss : C.text, opacity: 0.9 }}>{n.t}</span>
          </div>
        ))}
      </Panel>

      {sel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(5,8,12,.75)" }} onClick={() => setSel(null)}>
          <div className="w-full max-w-lg rounded-t-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.line}`, maxHeight: "88vh", overflowY: "auto", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 style={{ fontFamily: serif, fontSize: 21 }}>{co.n}</h3>
                <Num size={11} color={C.dim}>{co.t} · {co.sec} · {co.cat}</Num>
              </div>
              <button onClick={() => setSel(null)} style={{ color: C.dim }}><X size={20} /></button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <Panel className="p-3"><Num size={9} color={C.dim}>PRICE</Num><div><Num size={16}>{fmt(live.price)}</Num></div></Panel>
              <Panel className="p-3"><Num size={9} color={C.dim}>EPS</Num><div><Num size={16}>{fmt(live.eps)}</Num></div></Panel>
              <Panel className="p-3"><Num size={9} color={C.dim}>P/E</Num><div><Num size={16}>{fmt(live.price / live.eps, 1)}</Num></div></Panel>
            </div>

            <Panel className="p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <Eye size={13} color={valueLens ? C.brass : C.dim} />
                <Num size={10} color={C.dim}>VALUE LENS {valueLens ? "" : "· LOCKED"}</Num>
              </div>
              {valueLens ? (
                <div>
                  <div className="flex justify-between items-baseline">
                    <span style={{ fontSize: 13, color: C.dim }}>Model fair value</span>
                    <Num size={15} color={C.brass}>CHF {fmt(iv)}</Num>
                  </div>
                  <div className="flex justify-between items-baseline mt-1">
                    <span style={{ fontSize: 13, color: C.dim }}>Price vs value</span>
                    <Num size={15} color={live.price < iv ? C.gain : C.loss}>{pct(live.price / iv - 1, 0)}</Num>
                  </div>
                  <p className="mt-2" style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>
                    Fair value here = normalised EPS × a multiple derived from growth and moat. It is a simplified model, not truth. Your job is to decide whether you agree with it.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5 }}>Complete any lesson in Unit 05 (Valuation) to unlock the fair-value estimate. Until then you invest on price and business quality alone — which is exactly how it feels before you learn to value.</p>
              )}
            </Panel>

            <p className="mb-3" style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.85 }}><Rich>{co.note}</Rich></p>

            <div className="flex gap-2 items-center mb-2">
              <input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" placeholder="Shares"
                className="px-3 py-2 rounded-md flex-1 outline-none"
                style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.text, fontFamily: mono }} />
              <Btn small onClick={() => setQty(String(Math.floor(st.pf.cash / live.price)))}>Max</Btn>
            </div>
            <div className="flex justify-between mb-3">
              <Num size={11} color={C.dim}>Cost: CHF {fmt0((parseFloat(qty) || 0) * live.price)}</Num>
              <Num size={11} color={C.dim}>Cash: CHF {fmt0(st.pf.cash)}</Num>
            </div>
            <div className="flex gap-2">
              <Btn kind="primary" className="flex-1" onClick={() => trade("buy")}>Buy</Btn>
              <Btn kind="danger" className="flex-1" onClick={() => trade("sell")} disabled={!st.pf.pos[sel]}>Sell</Btn>
            </div>
            {st.pf.pos[sel] && (
              <div className="mt-3 pt-3 flex justify-between" style={{ borderTop: `1px solid ${C.line}` }}>
                <Num size={11} color={C.dim}>You own {fmt0(st.pf.pos[sel].sh)} sh @ avg {fmt(st.pf.pos[sel].cost / st.pf.pos[sel].sh)}</Num>
                <Num size={11} color={live.price * st.pf.pos[sel].sh >= st.pf.pos[sel].cost ? C.gain : C.loss}>
                  {pct((live.price * st.pf.pos[sel].sh) / st.pf.pos[sel].cost - 1)}
                </Num>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ANGEL / DEALS TAB
   ============================================================ */
function DealsTab({ st, setSt }) {
  const [openId, setOpenId] = useState(null);
  const [amt, setAmt] = useState("");
  const m = st.mkt.month;
  const offer = st.angel.offers.find((o) => o.id === openId);
  const active = st.angel.holdings.filter((h) => h.status === "active");
  const closed = st.angel.holdings.filter((h) => h.status !== "active");
  const invested = st.angel.holdings.reduce((a, h) => a + h.amt, 0);
  const returned = closed.reduce((a, h) => a + (h.proceeds || 0), 0);

  const invest = (o) => {
    const a = parseFloat(amt) || 0;
    if (a <= 0 || a > st.angel.cash) return;
    setSt((s) => ({
      ...s,
      angel: {
        ...s.angel,
        cash: s.angel.cash - a,
        offers: s.angel.offers.filter((x) => x.id !== o.id),
        holdings: [...s.angel.holdings, {
          id: o.id, name: o.name, sector: o.sector, amt: a, q: o.q, month: m,
          own0: a / (o.val * 1e6), own: a / (o.val * 1e6), rounds: 0,
          resolve: m + 30 + Math.floor(Math.random() * 42), status: "active",
        }],
      },
    }));
    setOpenId(null); setAmt("");
  };

  return (
    <div className="pb-28">
      <Panel className="p-4 mb-3">
        <Eyebrow>Angel book · month {m}</Eyebrow>
        <div className="grid grid-cols-3 gap-3">
          <div><Num size={10} color={C.dim}>DRY POWDER</Num><div><Num size={16}>{fmt0(st.angel.cash)}</Num></div></div>
          <div><Num size={10} color={C.dim}>DEPLOYED</Num><div><Num size={16}>{fmt0(invested)}</Num></div></div>
          <div><Num size={10} color={C.dim}>RETURNED</Num><div><Num size={16} color={returned >= invested && closed.length ? C.gain : C.text}>{fmt0(returned)}</Num></div></div>
        </div>
        <p className="mt-3" style={{ fontSize: 12, color: C.dim, lineHeight: 1.5 }}>
          Deals appear every few months. Cheque sizes are small on purpose: the power law rewards more shots, not bigger ones. Outcomes resolve after 30–70 months, with dilution applied every 18.
        </p>
      </Panel>

      <Eyebrow>Open deals</Eyebrow>
      {st.angel.offers.length === 0 ? (
        <Panel className="p-4 mb-3"><p style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>No live deals. Advance time in the Portfolio tab — deal flow is lumpy, and waiting is part of the job.</p></Panel>
      ) : (
        <div className="flex flex-col gap-2 mb-4">
          {st.angel.offers.map((o) => (
            <button key={o.id} onClick={() => setOpenId(o.id)} className="px-4 py-3 rounded-lg text-left" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div style={{ fontSize: 14.5 }}>{o.name}</div>
                  <Num size={10} color={C.dim}>{o.sector} · {o.stage} · CHF {o.val}m cap</Num>
                </div>
                <div className="text-right">
                  <Num size={13}>{fmt0(o.ask)}</Num>
                  <div><Num size={10} color={C.dim}>closes M{o.expires}</Num></div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {active.length > 0 && (
        <>
          <Eyebrow>Active positions</Eyebrow>
          <Panel className="mb-4">
            {active.map((h, i) => (
              <div key={h.id} className="px-4 py-3 flex items-center" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                <div className="flex-1">
                  <div style={{ fontSize: 14 }}>{h.name}</div>
                  <Num size={10} color={C.dim}>CHF {fmt0(h.amt)} · {fmt(h.own * 100, 2)}% · {h.rounds} dilution rounds</Num>
                </div>
                <Num size={11} color={C.dim}>resolves M{h.resolve}</Num>
              </div>
            ))}
          </Panel>
        </>
      )}

      {closed.length > 0 && (
        <>
          <Eyebrow>Realised · {closed.filter((h) => h.status === "failed").length} of {closed.length} went to zero</Eyebrow>
          <Panel>
            {closed.map((h, i) => (
              <div key={h.id} className="px-4 py-3 flex items-center" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
                <div className="flex-1">
                  <div style={{ fontSize: 14 }}>{h.name}</div>
                  <Num size={10} color={C.dim}>invested {fmt0(h.amt)}</Num>
                </div>
                <div className="text-right">
                  <Num size={13} color={h.status === "failed" ? C.loss : C.gain}>{h.status === "failed" ? "0x" : `${fmt(h.mult, 1)}x`}</Num>
                  <div><Num size={10} color={C.dim}>{fmt0(h.proceeds || 0)}</Num></div>
                </div>
              </div>
            ))}
          </Panel>
        </>
      )}

      {offer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(5,8,12,.75)" }} onClick={() => setOpenId(null)}>
          <div className="w-full max-w-lg rounded-t-2xl p-5" style={{ background: C.surface, border: `1px solid ${C.line}`, maxHeight: "88vh", overflowY: "auto", paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom, 0px))" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 style={{ fontFamily: serif, fontSize: 21 }}>{offer.name}</h3>
                <Num size={11} color={C.dim}>{offer.sector} · {offer.stage} · CHF {offer.val}m post-money</Num>
              </div>
              <button onClick={() => setOpenId(null)} style={{ color: C.dim }}><X size={20} /></button>
            </div>
            <p className="mb-3" style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.88 }}><Rich>{offer.desc}</Rich></p>
            <Eyebrow>Diligence notes</Eyebrow>
            <div className="flex flex-col gap-2 mb-4">
              {offer.signals.map((s, i) => (
                <div key={i} className="flex gap-2 items-start px-3 py-2 rounded" style={{ background: C.surface2 }}>
                  {s.good ? <Check size={14} color={C.gain} style={{ marginTop: 2, flexShrink: 0 }} /> : <AlertTriangle size={14} color={C.loss} style={{ marginTop: 2, flexShrink: 0 }} />}
                  <span style={{ fontSize: 13, lineHeight: 1.45 }}><Rich>{s.s}</Rich></span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 items-center mb-2">
              <input value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="numeric" placeholder={`Suggested ${fmt0(offer.ask)}`}
                className="px-3 py-2 rounded-md flex-1 outline-none"
                style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.text, fontFamily: mono }} />
              <Btn small onClick={() => setAmt(String(offer.ask))}>Ask</Btn>
            </div>
            <Num size={11} color={C.dim}>
              CHF {fmt0(parseFloat(amt) || 0)} buys {fmt(((parseFloat(amt) || 0) / (offer.val * 1e6)) * 100, 3)}% before dilution · dry powder {fmt0(st.angel.cash)}
            </Num>
            <div className="flex gap-2 mt-3">
              <Btn kind="primary" className="flex-1" onClick={() => invest(offer)}>Invest</Btn>
              <Btn className="flex-1" onClick={() => { setSt((s) => ({ ...s, angel: { ...s.angel, offers: s.angel.offers.filter((x) => x.id !== offer.id) } })); setOpenId(null); }}>Pass</Btn>
            </div>
            <p className="mt-3" style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>
              Passing is a real decision, not a failure to act. Most angel returns are destroyed by cheques that should never have been written.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   TOOLS TAB
   ============================================================ */
const Field = ({ label, value, set, suffix }) => (
  <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${C.line}` }}>
    <span style={{ fontSize: 13, color: C.dim }}>{label}</span>
    <div className="flex items-center gap-1">
      <input value={value} onChange={(e) => set(e.target.value)} inputMode="decimal"
        className="px-2 py-1 rounded text-right w-24 outline-none"
        style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.text, fontFamily: mono, fontSize: 13 }} />
      {suffix && <Num size={11} color={C.dim}>{suffix}</Num>}
    </div>
  </div>
);
const Result = ({ label, value, note }) => (
  <div className="mt-3 px-3 py-3 rounded" style={{ background: C.surface2, border: `1px solid ${C.brass}` }}>
    <Num size={10} color={C.dim}>{label}</Num>
    <div><Num size={20} color={C.brass}>{value}</Num></div>
    {note && <p className="mt-1" style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}><Rich>{note}</Rich></p>}
  </div>
);
const N = (v) => parseFloat(String(v).replace(/[',\s]/g, "")) || 0;


function LibraryPanel({ st, openTerm }) {
  const [q, setQ] = useState("");
  const [acr, setAcr] = useState(false);
  const [open, setOpen] = useState({});          // sections start closed
  const seen = st.seen || {};
  const recent = Object.keys(seen)
    .filter((k) => GLOSSARY[k])
    .sort((a, b) => seen[b] - seen[a])
    .slice(0, 8);

  const match = (k) => {
    if (acr && !IS_ACRONYM(k)) return false;
    if (!q.trim()) return true;
    const n = q.toLowerCase();
    return k.toLowerCase().includes(n) || GLOSSARY[k].t.toLowerCase().includes(n) || GLOSSARY[k].d.toLowerCase().includes(n);
  };

  const groups = [...CATEGORIES.map((c) => ({ n: c.n, k: c.k.filter(match) })),
                  ...(UNCATEGORISED.length ? [{ n: "Other", k: UNCATEGORISED.filter(match) }] : [])]
                 .filter((g) => g.k.length);
  const total = groups.reduce((a, g) => a + g.k.length, 0);
  // while searching or filtering, sections open automatically or results would be hidden
  const filtering = !!q.trim() || acr;
  const allOpen = groups.length > 0 && groups.every((g) => open[g.n]);

  const Row = ({ k, i }) => (
    <button onClick={() => openTerm(k)} className="w-full text-left py-3 flex items-start gap-2"
      style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
      <div className="flex-1">
        <div style={{ fontSize: 14.5 }}>{GLOSSARY[k].t}</div>
        <div style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.45, marginTop: 2 }}>
          {GLOSSARY[k].d.length > 95 ? GLOSSARY[k].d.slice(0, 95) + "…" : GLOSSARY[k].d}
        </div>
      </div>
      <div className="flex items-center gap-2" style={{ paddingTop: 2 }}>
        {GLOSSARY[k].f && <Num size={9} color={C.brass}>ƒ</Num>}
        {seen[k] && <span style={{ width: 6, height: 6, borderRadius: 99, background: C.gain, display: "block" }} />}
        <ChevronRight size={14} color={C.dim} />
      </div>
    </button>
  );

  return (
    <div>
      <p className="mb-3" style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>
        Every term the app uses, with the formula and a worked example. Tap a section to open it, or just search. A green dot marks the ones you have already looked up; ƒ marks the ones with a formula.
      </p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a term or an acronym"
        className="px-3 py-2 rounded-md w-full outline-none mb-2"
        style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.text, fontSize: 14 }} />
      <div className="flex gap-2 mb-4">
        <button onClick={() => setAcr(!acr)} className="px-3 py-1.5 rounded-full"
          style={{ fontSize: 12, background: acr ? C.brass : C.surface, color: acr ? "#12181F" : C.dim, border: `1px solid ${acr ? C.brass : C.line}` }}>
          Acronyms only
        </button>
        <div className="flex items-center flex-1 justify-between">
          <Num size={11} color={C.dim}>{total} of {Object.keys(GLOSSARY).length}</Num>
          {!filtering && (
            <button onClick={() => setOpen(allOpen ? {} : Object.fromEntries(groups.map((g) => [g.n, true])))}
              style={{ fontSize: 11, color: C.dim, fontFamily: mono }}>
              {allOpen ? "COLLAPSE ALL" : "EXPAND ALL"}
            </button>
          )}
        </div>
      </div>

      {recent.length > 0 && !q.trim() && !acr && (
        <div className="mb-4">
          <Eyebrow>Recently looked up</Eyebrow>
          <Panel className="px-4 py-1">
            {recent.map((k, i) => <Row key={k} k={k} i={i} />)}
          </Panel>
        </div>
      )}

      {total === 0 && (
        <Panel className="p-4"><p style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>Nothing matches that. Try a shorter word, or switch off the acronym filter.</p></Panel>
      )}

      {groups.map((g) => {
        const isOpen = filtering || !!open[g.n];
        return (
          <div key={g.n} className="mb-2">
            <button onClick={() => setOpen((o) => ({ ...o, [g.n]: !o[g.n] }))}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-lg"
              aria-expanded={isOpen}
              style={{ background: C.surface, border: `1px solid ${isOpen ? C.brass : C.line}` }}>
              <ChevronRight size={15} color={isOpen ? C.brass : C.dim}
                style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }} />
              <span className="flex-1 text-left" style={{ fontSize: 14, color: isOpen ? C.brass : C.text }}>{g.n}</span>
              <Num size={11} color={C.dim}>{g.k.length}</Num>
            </button>
            {isOpen && (
              <Panel className="px-4 py-1 mt-1">
                {g.k.map((k, i) => <Row key={k} k={k} i={i} />)}
              </Panel>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ToolsTab({ st, openTerm }) {
  const [t, setT] = useState("intrinsic");
  const [eps, setEps] = useState("5"), [g, setG] = useState("10"), [exitPE, setExitPE] = useState("15"), [req, setReq] = useState("10");
  const [bvps, setBvps] = useState("20"), [gEps, setGEps] = useState("3");
  const [ni, setNi] = useState("120"), [da, setDa] = useState("40"), [capex, setCapex] = useState("55"), [wc, setWc] = useState("10");
  const [cap, setCap] = useState("10000"), [mo, setMo] = useState("500"), [dy, setDy] = useState("3"), [dg, setDg] = useState("7"), [yr, setYr] = useState("25");

  const [pane, setPane] = useState("calc");
  const tabs = [["intrinsic", "Buy price"], ["graham", "Graham"], ["owner", "Owner earnings"], ["income", "Income engine"]];

  const eps10 = N(eps) * Math.pow(1 + N(g) / 100, 10);
  const future = eps10 * N(exitPE);
  const maxPrice = future / Math.pow(1 + N(req) / 100, 10);
  const graham = Math.sqrt(22.5 * N(gEps) * N(bvps));
  const owner = N(ni) + N(da) - N(capex) - N(wc);

  let bal = N(cap), income = 0, contrib = N(mo) * 12;
  const yrs = Math.min(60, Math.max(1, Math.round(N(yr))));
  for (let i = 0; i < yrs; i++) { const inc = bal * (N(dy) / 100); income = inc; bal = (bal + inc + contrib) * (1 + N(dg) / 100); }

  return (
    <div className="pb-28">
      <Eyebrow>Working tools</Eyebrow>
      <h2 className="mb-3" style={{ fontFamily: serif, fontSize: 26 }}>{pane === "calc" ? "Calculators" : "Library"}</h2>

      <div className="flex gap-2 mb-4">
        {[["calc", "Calculators", Calculator], ["lib", "Library", BookMarked]].map(([k, l, Icon]) => (
          <button key={k} onClick={() => setPane(k)} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md"
            style={{ fontSize: 13, background: pane === k ? C.surface2 : "transparent",
                     border: `1px solid ${pane === k ? C.brass : C.line}`, color: pane === k ? C.brass : C.dim }}>
            <Icon size={14} /> {l}
          </button>
        ))}
      </div>

      {pane === "lib" && <LibraryPanel st={st} openTerm={openTerm} />}

      {pane === "calc" && <>
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setT(k)} className="px-3 py-1.5 rounded-full whitespace-nowrap"
            style={{ fontSize: 12, background: t === k ? C.brass : C.surface, color: t === k ? "#12181F" : C.dim, border: `1px solid ${t === k ? C.brass : C.line}` }}>{l}</button>
        ))}
      </div>

      {t === "intrinsic" && (
        <Panel className="p-4">
          <p className="mb-3" style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>Buffett’s equity-bond logic inverted: instead of asking what a company is worth, ask what you can pay today to earn your required return.</p>
          <Field label="Current EPS" value={eps} set={setEps} suffix="CHF" />
          <Field label="Earnings growth" value={g} set={setG} suffix="% p.a." />
          <Field label="Exit P/E in year 10" value={exitPE} set={setExitPE} suffix="×" />
          <Field label="Your required return" value={req} set={setReq} suffix="%" />
          <Result label="MAXIMUM PRICE TODAY" value={`CHF ${fmt(maxPrice)}`}
            note={`EPS reaches ${fmt(eps10)} in year 10, valued at ${fmt(future, 0)}. Anything above CHF ${fmt(maxPrice, 0)} means accepting less than ${N(req)}% per year. Use conservative growth — this is where optimism hides.`} />
        </Panel>
      )}

      {t === "graham" && (
        <Panel className="p-4">
          <p className="mb-3" style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>Graham’s defensive ceiling: caps you at roughly 15× earnings and 1.5× book. A screen, not a verdict.</p>
          <Field label="EPS" value={gEps} set={setGEps} suffix="CHF" />
          <Field label="Book value per share" value={bvps} set={setBvps} suffix="CHF" />
          <Result label="GRAHAM NUMBER" value={`CHF ${fmt(graham)}`} note="Above this price, a defensive investor is paying more than Graham’s combined earnings and asset limit. It ignores intangible-heavy businesses entirely — do not apply it to software." />
        </Panel>
      )}

      {t === "owner" && (
        <Panel className="p-4">
          <p className="mb-3" style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>What the owner can actually take out each year without shrinking the business.</p>
          <Field label="Net income" value={ni} set={setNi} />
          <Field label="+ Depreciation & amortisation" value={da} set={setDa} />
          <Field label="− Maintenance capex" value={capex} set={setCapex} />
          <Field label="− Working capital increase" value={wc} set={setWc} />
          <Result label="OWNER EARNINGS" value={fmt(owner)}
            note={`${owner < N(ni) ? `${fmt(((N(ni) - owner) / N(ni)) * 100, 0)}% of reported profit never reaches the owner.` : "Owner earnings exceed net income — check whether D&A overstates real capital consumption."} At a 10% required return, this stream is worth about ${fmt(owner * 10, 0)}.`} />
        </Panel>
      )}

      {t === "income" && (
        <Panel className="p-4">
          <p className="mb-3" style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>Passive income is dividend growth plus contributions plus time. Run it honestly, with numbers you can actually save.</p>
          <Field label="Starting capital" value={cap} set={setCap} suffix="CHF" />
          <Field label="Monthly contribution" value={mo} set={setMo} suffix="CHF" />
          <Field label="Starting yield" value={dy} set={setDy} suffix="%" />
          <Field label="Total growth rate" value={dg} set={setDg} suffix="% p.a." />
          <Field label="Years" value={yr} set={setYr} />
          <Result label={`PORTFOLIO AFTER ${yrs} YEARS`} value={`CHF ${fmt0(bal)}`}
            note={`Annual dividend income about CHF ${fmt0(income)} — roughly CHF ${fmt0(income / 12)} per month. Contributions total CHF ${fmt0(contrib * yrs)}. If the contribution is doing most of the work, your savings rate matters more than your stock picking right now.`} />
        </Panel>
      )}
      <p className="mt-4 px-1" style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>
        Educational simulation only. Nothing here is financial or tax advice, and the market engine is a model, not reality.
      </p>
      </>}
    </div>
  );
}

/* ============================================================
   PROGRESS TAB
   ============================================================ */
function ProgressTab({ st, reset }) {
  const level = 1 + Math.floor(st.xp / 200);
  const doneL = Object.keys(st.done).length;
  const qAcc = Object.values(st.done).reduce((a, d) => a + d.c, 0) / Math.max(1, Object.values(st.done).reduce((a, d) => a + d.t, 0));
  const scenScores = Object.values(st.scen);
  const scenAvg = scenScores.length ? scenScores.reduce((a, b) => a + b, 0) / scenScores.length : null;
  const m = st.mkt;
  const eq = Object.entries(st.pf.pos).reduce((a, [t, p]) => a + p.sh * m.co[t].price, 0);
  const angelActive = st.angel.holdings.filter((h) => h.status === "active").reduce((a, h) => a + h.amt, 0);
  const nw = st.pf.cash + eq + st.angel.cash + angelActive;
  const start = START_CASH + START_ANGEL;
  const years = m.month / 12;
  const cagr = years > 0.4 ? Math.pow(nw / start, 1 / years) - 1 : null;
  const bCagr = years > 0.4 ? Math.pow((st.pf.bench[st.pf.bench.length - 1]?.v || start) / start, 1 / years) - 1 : null;
  const trades = st.pf.tx.filter((t) => t.k !== "div").length;
  const turnover = years > 0.5 ? trades / years : null;

  const verdict = () => {
    const out = [];
    if (doneL < 6) out.push("You have barely started the curriculum. Every decision you make in the portfolio right now is a guess wearing a suit.");
    if (qAcc < 0.7 && doneL >= 3) out.push(`Quiz accuracy is ${fmt(qAcc * 100, 0)}%. Redo the units you scored badly on before trusting yourself with size.`);
    if (scenAvg !== null && scenAvg < 1.5) out.push("Your scenario decisions score poorly. You know the theory and abandon it under pressure — that gap is what actually costs money.");
    if (turnover !== null && turnover > 10) out.push(`You are making about ${fmt(turnover, 0)} trades a year. That is trading, not investing, and in Switzerland it can also cost you the capital gains exemption.`);
    if (cagr !== null && bCagr !== null && cagr < bCagr) out.push(`You are behind the index by ${fmt((bCagr - cagr) * 100, 1)} points a year. If that persists over a real decade, the honest answer is a bigger index core and a smaller satellite.`);
    if (cagr !== null && bCagr !== null && cagr > bCagr) out.push(`You are ahead of the index by ${fmt((cagr - bCagr) * 100, 1)} points a year. Before you conclude you have skill: check whether one position produced all of it.`);
    if (st.angel.holdings.length > 0 && st.angel.holdings.length < 8) out.push(`Only ${st.angel.holdings.length} angel positions. The power law needs 20+ shots; with this few, expect zero.`);
    if (!out.length) out.push("Nothing alarming yet. Keep advancing time — most of the real lessons in this simulation only appear after a full market cycle.");
    return out;
  };

  return (
    <div className="pb-28">
      <Panel className="p-5 mb-3">
        <Eyebrow>Level {level}</Eyebrow>
        <Num size={30} weight={600}>{fmt0(st.xp)} XP</Num>
        <div className="h-1.5 rounded mt-3" style={{ background: C.line }}>
          <div className="h-1.5 rounded" style={{ width: `${((st.xp % 200) / 200) * 100}%`, background: C.brass }} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div><Num size={10} color={C.dim}>LESSONS</Num><div><Num size={16}>{doneL}/{LESSONS.length}</Num></div></div>
          <div><Num size={10} color={C.dim}>ACCURACY</Num><div><Num size={16}>{doneL ? fmt(qAcc * 100, 0) + "%" : "—"}</Num></div></div>
          <div><Num size={10} color={C.dim}>SCENARIOS</Num><div><Num size={16}>{scenScores.length}/{SCENARIOS.length}</Num></div></div>
        </div>
      </Panel>

      <Eyebrow>Unit mastery</Eyebrow>
      <Panel className="p-4 mb-3">
        {UNITS.map((u) => {
          const ls = LESSONS.filter((l) => l.unit === u.id);
          const got = ls.reduce((a, l) => a + (st.done[l.id]?.c || 0), 0);
          const tot = ls.reduce((a, l) => a + l.quiz.length, 0);
          return (
            <div key={u.id} className="py-2">
              <div className="flex justify-between mb-1">
                <span style={{ fontSize: 13 }}>{u.name}</span>
                <Num size={11} color={C.dim}>{got}/{tot}</Num>
              </div>
              <div className="h-1 rounded" style={{ background: C.line }}>
                <div className="h-1 rounded" style={{ width: `${(got / tot) * 100}%`, background: u.color }} />
              </div>
            </div>
          );
        })}
      </Panel>

      <Eyebrow>Honest read</Eyebrow>
      <Panel className="p-4 mb-3">
        {verdict().map((v, i) => (
          <div key={i} className="flex gap-2 py-2" style={{ borderTop: i ? `1px solid ${C.line}` : "none" }}>
            <Target size={14} color={C.brass} style={{ marginTop: 3, flexShrink: 0 }} />
            <span style={{ fontSize: 13.5, lineHeight: 1.55, opacity: 0.9 }}><Rich>{v}</Rich></span>
          </div>
        ))}
      </Panel>

      <Panel className="p-4 mb-3">
        <div className="flex justify-between items-center">
          <div>
            <Num size={10} color={C.dim}>VERSION</Num>
            <div><Num size={15}>Version {BUILD}</Num></div>
          </div>
          <Num size={11} color={C.dim}>{BUILD_DATE}</Num>
        </div>
        <p className="mt-2" style={{ fontSize: 11.5, color: C.dim, lineHeight: 1.5 }}>
          If this version number does not change after you upload a new build, the phone is showing a cached copy — close the app fully and reopen it, or remove and re-add the home screen icon.
        </p>
      </Panel>

      <Eyebrow>Backup</Eyebrow>
      <Panel className="p-4 mb-3">
        <p className="mb-3" style={{ fontSize: 12.5, color: C.dim, lineHeight: 1.5 }}>
          Progress saves to this browser automatically. Clearing site data erases it, so export a file before you switch machines.
        </p>
        <div className="flex gap-2">
          <Btn className="flex-1" onClick={() => {
            const blob = new Blob([JSON.stringify(st)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `paper-investor-month${st.mkt.month}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}>Export save file</Btn>
          <Btn className="flex-1" onClick={() => document.getElementById("pi-import").click()}>Import save file</Btn>
        </div>
        <input id="pi-import" type="file" accept="application/json" style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = () => {
              try {
                const p = JSON.parse(r.result);
                if (!p?.mkt?.co) throw new Error("bad file");
                window.localStorage.setItem("paper-investor:v1", JSON.stringify(p));
                window.location.reload();
              } catch (err) {
                alert("That file isn’t a Paper Investor save. Export one from the Progress tab first.");
              }
            };
            r.readAsText(f);
          }} />
      </Panel>

      <Btn kind="danger" className="w-full" onClick={reset}><span className="flex items-center justify-center gap-2"><RotateCcw size={14} /> Reset all progress</span></Btn>
    </div>
  );
}

/* ============================================================
   APP
   ============================================================ */
export default function App() {
  const [st, setSt] = useState(NEW_STATE);
  const [tab, setTab] = useState("learn");
  const [loaded, setLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const KEY = "paper-investor:v1";

  useEffect(() => {
    (async () => {
      try {
        if (window.storage) {
          const r = await window.storage.get(KEY);
          if (r?.value) { const p = JSON.parse(r.value); if (p?.mkt?.co) setSt(p); }
        }
      } catch (e) { /* first run */ }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      try { window.storage?.set(KEY, JSON.stringify(st)).catch(() => {}); } catch (e) {}
    }, 700);
    return () => clearTimeout(id);
  }, [st, loaded]);

  const advance = (n) => {
    setRunning(true);
    setTimeout(() => {
      setSt((s) => { let c = s; for (let i = 0; i < n; i++) c = stepMarket(c); return c; });
      setRunning(false);
    }, 20);
  };

  const reset = () => { if (confirm("Erase all lessons, scores and the portfolio?")) setSt(NEW_STATE()); };

  const m = st.mkt;
  const eq = Object.entries(st.pf.pos).reduce((a, [t, p]) => a + p.sh * (m.co[t]?.price || 0), 0);
  const nw = st.pf.cash + eq + st.angel.cash + st.angel.holdings.filter((h) => h.status === "active").reduce((a, h) => a + h.amt, 0);

  const [term, setTerm] = useState(null);
  const [gloss, setGloss] = useState(false);
  // remember which terms have been looked up, so the Library can surface them again
  const openTerm = (k) => {
    setTerm(k);
    setSt((prev) => ({ ...prev, seen: { ...(prev.seen || {}), [k]: Date.now() } }));
  };

  const TABS = [
    ["learn", "Learn", BookOpen], ["scen", "Decide", Target], ["pf", "Portfolio", TrendingUp],
    ["deals", "Angel", Rocket], ["tools", "Tools", Calculator], ["prog", "Progress", Award],
  ];

  if (!loaded) return <div style={{ background: C.bg, minHeight: "100vh" }} />;

  return (
    <TermCtx.Provider value={openTerm}>
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="max-w-lg mx-auto px-4 pt-5" style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top, 0px))" }}>
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <div style={{ fontFamily: serif, fontSize: 19, letterSpacing: "-0.01em" }}>Paper Investor</div>
            <Num size={10} color={C.dim}>MONTH {m.month} · v{BUILD}</Num>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><Flame size={13} color={C.brass} /><Num size={12}>{fmt0(st.xp)}</Num></div>
            <div className="flex items-center gap-1"><Wallet size={13} color={C.dim} /><Num size={12}>{fmt0(nw / 1000)}k</Num></div>
            <button onClick={() => setGloss(true)} aria-label="Open glossary"
              className="flex items-center justify-center rounded-md"
              style={{ width: 30, height: 30, background: C.surface, border: `1px solid ${C.line}`, color: C.brass }}>
              <BookMarked size={15} />
            </button>
          </div>
        </div>

        {tab === "learn" && <LearnTab st={st} setSt={setSt} />}
        {tab === "scen" && <ScenarioTab st={st} setSt={setSt} />}
        {tab === "pf" && <PortfolioTab st={st} setSt={setSt} advance={advance} running={running} />}
        {tab === "deals" && <DealsTab st={st} setSt={setSt} />}
        {tab === "tools" && <ToolsTab st={st} openTerm={openTerm} />}
        {tab === "prog" && <ProgressTab st={st} reset={reset} />}
      </div>

      <div className="fixed bottom-0 left-0 right-0" style={{ background: C.surface, borderTop: `1px solid ${C.line}`, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="max-w-lg mx-auto flex">
          {TABS.map(([k, l, Icon]) => (
            <button key={k} onClick={() => setTab(k)} className="flex-1 flex flex-col items-center gap-1 py-3"
              style={{ color: tab === k ? C.brass : C.dim }}>
              <Icon size={17} />
              <span style={{ fontSize: 9.5, fontFamily: mono, letterSpacing: "0.06em" }}>{l.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      {gloss && <GlossaryBrowser onClose={() => setGloss(false)} onOpen={(k) => { setGloss(false); openTerm(k); }} />}
      {term && <TermSheet termKey={term} onClose={() => setTerm(null)} onOpen={(k) => openTerm(k)} />}
    </div>
    </TermCtx.Provider>
  );
}
