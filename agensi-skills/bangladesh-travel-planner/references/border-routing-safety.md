# Border Routing Safety Reference

## Problem

Bangladesh shares borders with India on three sides and Myanmar to the southeast.
Road routing engines (OSRM, Valhalla, GraphHopper) build routes from the OpenStreetMap
road graph, which includes cross-border roads. When two destinations near the border
are closer through India than via Bangladeshi roads, the router sends traffic through
a foreign country — which is useless to the traveler.

## Known Problem Pairs

| Origin | Destination | Unsafe Route Goes Through | Fix |
|---|---|---|---|
| Bichanakandi | Jaflong | Meghalaya, India | Force via Gowainghat (25.094, 91.983) |
| Jaflong | Panthumai | Meghalaya, India | Force via Gowainghat |
| Tamabil | Bichanakandi | Meghalaya, India | Force via Gowainghat |
| Utma Chhara | Jaflong | Meghalaya, India | Force via Gowainghat |
| Hili Area | Ramsagar | West Bengal, India | Force via Dinajpur town (25.63, 88.65) |
| Banglabandha | Tetulia | West Bengal, India | Usually stays in BD, but verify |
| Teknaf | Naikhongchhari | Myanmar/Rakhine | Verify boundary check |

## Northern Sylhet Border Cluster

All of these destinations sit within 5 km of the Meghalaya (India) border:
- Bichanakandi (25.171, 91.887)
- Jaflong (25.166, 92.017)
- Panthumai (25.176, 91.957)
- Tamabil (25.181, 92.034)
- Utma Chhara (25.175, 91.822)

**Rule:** Any route between two of these MUST include Gowainghat Road Junction
(25.094, 91.983) as a forced waypoint.

## Valhalla Exclude-and-Retry Strategy

```
1. Request shortest-distance A* route
2. Check if route stays inside Bangladesh boundary polygon
3. If not:
   a. Find first coordinate outside Bangladesh
   b. Add to exclude_locations list
   c. Re-request (up to 3 retries, max 20 exclusion points)
4. If still no safe route: report "Bangladesh-only route unavailable"
5. NEVER fall back to fastest-time routing as a substitute
```

## Sundarbans / Khulna Road Access Points

Destinations inside the Sundarbans are reached by boat, not by road.
Route the driving leg to the departure port:

| Departure Point | Lat | Lng | Serves |
|---|---|---|---|
| Mongla | 22.494 | 89.602 | Bagerhat Sundarbans, Karamjal, Dhangmari |
| Burigoalini | 22.289 | 89.196 | Satkhira Sundarbans, Mandarbaria, Kalagachhia |
| Balikhola | 24.459 | 90.962 | Kishoreganj haor destinations |
