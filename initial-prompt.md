/sdd-chart I want to create a web app that allows people to create rooms and play checkers and tic-tac toe online. For that I am thinking of using peer-js (WebRTC) library. I don't want to setup a backend, it should be client-side only. I want to host the website through GitHub pages. Perhaps we start only with tic tac toe since it's a more simple game than checkers. I want the game implemented from scratch without using any libraries (we code the game ourselves) so we have full control. Users should be able to enter the website, choose the game (checkers or tic-tac-toe),  create a room after entering their name, which will generate a dynamic route, and then they can share with their friends, which can join the room with their name. I want them to be able to choose an emoji as an avatar. Let's use React for the web app. We have one hour to implement the first version of the app: the first version is what should be mapped here.

STRONG PROMPT
```markdown
| Section | Example ("Export my orders") |
|---|---|
| **Goal and why** | Customers keep asking support for their order history. Let them download it from the account page. |
| **Context** (02) | Read `OrdersService` and the account page first. Reuse the CSV helper in `reports/`. Don't guess about code you haven't opened. |
| **Done when** (01) | A CSV of the signed-in customer's orders. `OrdersExportTest` passes; no orders gives headers only. |
| **Limits** (03) | Only the signed-in customer's data. No new dependencies. Not in scope: email, other formats. |
| **Example** (04) | Same columns as the invoice CSV: date, order number, items, total, status. |
```