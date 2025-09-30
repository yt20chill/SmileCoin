## Inspiration
The project name was inspired by the iconic **Hong Kong Tourism Board advertisement **(2004) 《好客之道》, which begins with the line: “Your every smile…” — highlighting the warmth and hospitality that define Hong Kong.

At the same time, Hong Kong faces an urgent need to revitalise its economy, strengthen tourism promotion, and stimulate local consumption.

By combining gamification and blockchain, we aim to capture the spirit of Hong Kong hospitality while addressing real economic needs — creating a win-win ecosystem for both travellers and merchants.

#### Our Goals
- Enhance travel experiences in Hong Kong through interactive rewards.
- Provide merchants with exposure and feedback for service improvements.
- Build a gamified ecosystem with Smile Coin to drive continuous engagement.

## What it does
"Smile Travel HK" is a Hong Kong-based tourism and F&B merchant promotion platform powered by cryptocurrency technology. The core idea is to use "Smile Coin" (微笑幣) as an interactive feedback and reward mechanism for travelers and merchants.

- Tourists can register with their boarding pass upon arrival and receive Smile Coins.
- They can use Smile Coins to rate their experiences (1–3 coins) after spending at participating merchants.
- Smile Coins can be redeemed for vouchers, gifts, or even souvenirs at the airport.
- Merchants can create promotions, receive feedback through Smile Coins, and redeem them for perks such as fee reductions or advertising credits.
- Unused Smile Coins expire after a set period to encourage active use.

## How we built it
- **AI Development:** We used **Kiro** to accelerate prototyping — it helped us build the POC prototype very fast and provided a well-structured development plan, making our direction clear and organized.  
- **Tourist Frontend:** React + Next.js (English + Traditional Chinese).  
- **Merchant Frontend:** React
- **Backend:** Node.js, Redis with PostgreSQL database for users, merchants, transactions, and vouchers.  
- **Blockchain:** Smile Coin as an ERC-20 style token on a private sidechain to minimize fees.  

## Challenges we ran into
- Designing a user-friendly crypto wallet experience for travelers unfamiliar with blockchain.
- Ensuring smooth merchant onboarding while keeping the system simple.
- Balancing token economics so Smile Coins remain valuable but not tradeable.
- Handling multi-language UI/UX without overwhelming the design.

## Accomplishments that we're proud of
- Built a prototype where travelers can seamlessly register, earn, and spend Smile Coins.
- Created a dual-sided platform that benefits both travelers and merchants.
- Implemented gamified feedback to encourage positive interactions in the tourism ecosystem.

## What we learned
- How gamification and blockchain can be combined to enhance real-world tourism.
- The importance of building trust and usability for non-crypto-native users.
- The challenges of creating incentives that are fun, fair, and sustainable.
- How **AWS Kiro** can act as a powerful co-pilot — helping us develop faster, debug more efficiently, streamline collaboration, and most importantly, guide us with a structured development plan while speeding up POC building.


## What's next for Smile Travel HK x Smile Coin 微笑幣
- Launch MVP with basic wallet, merchant portal, and voucher redemption.
- Add gift redemption center for travelers and Smile Coin perk system for merchants.
- Develop mobile apps (iOS & Android) to make Smile Coins more accessible.
- Expand partnerships with airlines, hotels, and local attractions to grow the ecosystem.
