# Product Requirements Document (PRD)

## TourismuBD

**Version:** v1.6 — Final Getting Real Implementation Baseline  
**Status:** Final Product Definition / Build Baseline  
**Last Updated:** September 2, 2026  
**Initial Launch Market:** Sylhet District, Bangladesh  
**Primary Product:** Tourist-place discovery and practical route planning  
**Defined Provider Types:** Tour Guide, Houseboat Owner, Small Boat Owner, Resort/Hotel Owner, Car/Transport Owner, Parking Owner, Tour Agency/Tour Host Organization  
**Primary Operating Principle:** Build the smallest useful product the current team can realistically operate

---

# 1. Purpose of This PRD

This document is the final consolidated product definition for TourismuBD.

It combines the decisions made through the TourismuBD Getting Real planning process, especially Steps 3 through 19, the Core Route Planning Solution, the Guide/Agency contact concept, and the later water-tourism decisions.

The purpose of this PRD is to give the product and engineering team **one consistent implementation baseline**.

When an older requirement conflicts with a later decision in this document, **this document wins**.

Key superseded ideas include:

- the Facebook-style feed is no longer the product epicenter;
- a canonical `Place` is the foundation of destination data;
- Tour Guide booking uses Booking Marketplace Lite;
- provider contact details unlock only after a booking is confirmed;
- provider reviews use a simple 1–5-star model;
- trust language uses precise labels such as **Identity Verified**;
- the initial operation is designed for a tiny Admin / Operations team;
- complex ranking, AI itinerary generation, ads, and marketplace payment are not core launch requirements;
- water tourism is represented by two standard traveler choices: **Houseboat** and **Small Boat Rental**;
- provider monthly subscriptions are fixed as: **Tour Guide ৳10**, **Houseboat Owner ৳100**, **Small Boat Owner ৳50**, **Resort/Hotel Owner ৳100**, **Car/Transport Owner ৳50**, **Parking Owner ৳30**, and **Tour Agency/Tour Host Organization ৳70**;
- Houseboat duration is traveler-selectable nationwide with no district exception;
- Small Boat duration is traveler-selectable nationwide except for the **Sundarbans**, where it is fixed at one day;
- Resort/Hotel, Car/Transport, Parking, and Tour Agency/Tour Host Organization remain part of the TourismuBD provider architecture but are later-phase marketplaces, not initial-launch blockers.

---

# 2. Getting Real Product Rules

TourismuBD must keep the following principles during implementation.

## 2.1 Build Less

A feature is not included merely because it could be useful.

Ask:

> **Does this help the traveler complete the core TourismuBD journey?**

If not, postpone it.

## 2.2 Fix Time, Flex Scope

If the planned release is becoming too large, reduce optional scope rather than endlessly extending the schedule.

## 2.3 Epicenter First

The product must be designed around the most important traveler experience:

> **Place → Nearby Discovery → Trip → Route**

Provider discovery is connected to this core rather than replacing it.

## 2.4 Human Solutions First

At small scale, Admin may manually:

- verify providers,
- curate Places,
- review route data,
- review reports,
- correct booking states,
- moderate reviews,
- verify subscription payments.

Do not automate a problem before real scale makes automation necessary.

## 2.5 Real Data Before Clever Algorithms

TourismuBD should prefer:

- manually verified route information,
- curated destination knowledge,
- simple ranking,
- real provider interviews,
- real traveler feedback,

before complex scoring or AI.

## 2.6 Precise Trust

TourismuBD must never promise more than it actually verifies.

If only identity is checked, the public label is:

> **Identity Verified ✓**

not:

> Safe ✓ / Guaranteed ✓ / Business Verified ✓

unless those claims are actually supported by a defined verification process.

---

# 3. Product Vision

TourismuBD is a Bangladesh domestic travel-planning platform that helps travelers:

1. discover tourist Places,
2. understand practical information about those Places,
3. discover nearby Places,
4. select multiple Places for a trip,
5. choose a starting point,
6. generate a practical visiting sequence,
7. save the trip,
8. optionally find relevant tourism providers,
9. request a booking,
10. coordinate directly with the provider after confirmation,
11. leave a verified review after a completed booking.

TourismuBD is not trying to become every kind of travel application on day one.

The route-planning experience remains the product's center.

---

# 4. Core Problem

TourismuBD exists because travelers struggle to:

> **discover nearby tourist destinations and determine the most practical sequence for visiting multiple places in Bangladesh.**

Typical questions include:

- “I want to visit Ratargul. What else is nearby?”
- “I want to visit Ratargul, Jaflong, and Lalakhal. Which one should I visit first?”
- “I have two days. How should I organize the trip?”
- “Which Guide covers my route?”
- “Can I find a Houseboat here?”
- “Can I rent a Small Boat here?”

TourismuBD should reduce the need to manually combine scattered information from social media, maps, videos, random pages, and provider phone numbers.

---

# 5. Core Product Promise

Primary promise:

> **Find a Place, discover what is nearby, select where you want to go, and TourismuBD shows you a practical order to visit them.**

District-trip promise:

> **Choose a district and the number of days you have, and TourismuBD helps organize useful destinations into a practical trip.**

Routing promise:

> **A practical recommended route that reduces unnecessary travel and backtracking.**

TourismuBD must not claim that its route is always the mathematically shortest or globally perfect route.

---

# 6. First Target User

The first target traveler is:

> **Bangladeshi university students and young professionals, approximately 18–30, who take short domestic trips alone or with friends.**

Typical characteristics:

- smartphone user,
- budget-conscious,
- 1–3-day domestic trip,
- may know one famous destination but not nearby destinations,
- wants a practical visiting order,
- may travel independently,
- may want a Guide,
- may use water tourism where available.

The platform may serve families, couples, organizations, and international travelers later, but the early user experience should remain clear for this first target group.

---

# 7. Geographic Strategy

## 7.1 Initial Launch

TourismuBD first launches with a dense, high-quality experience in:

> **Sylhet District**

Primary travel hub:

> **Sylhet City**

TourismuBD must distinguish **Sylhet District** from the wider **Sylhet Division**.

## 7.2 Expansion Principle

TourismuBD may later expand district by district.

Do not try to populate all 64 districts with weak data at once.

The product architecture should support Bangladesh-wide expansion, but content and provider onboarding should remain market-by-market.

## 7.3 Same Water UI in Every District

Every district page must show the same water-tourism section:

```text
EXPLORE BY WATER

[ Find a Houseboat ]

[ Rent a Small Boat ]
```

This UI rule is nationwide.

TourismuBD must **not hide either option based on district**.

If no verified providers exist for the selected option in the selected district, show an honest empty state such as:

```text
No verified Houseboats are available here yet.
```

or:

```text
No verified Small Boats are available here yet.
```

The option remains visible.

---

# 8. Canonical Geographic Model

TourismuBD must not model travel only as free-text names.

The core geographic entities are:

```text
District
   ↓
Place
   ↓
Water Body / Tourism Area (where relevant)
```

## 8.1 District

A district is a primary browsing and planning boundary.

Suggested fields:

```text
id
name
division
slug
status
```

## 8.2 Place

A `Place` is one canonical tourist destination.

Example:

```text
Place ID: 101
Name: Ratargul Swamp Forest
District: Sylhet
```

Posts, trips, provider coverage, nearby relationships, and route data must reference the canonical Place rather than create duplicate destination identities.

## 8.3 Water Body / Tourism Area

Where water tourism exists, TourismuBD may maintain a canonical `water_body` or `water_area` entity.

Suggested fields:

```text
id
name
type
primary_district_id
division
latitude        // optional
longitude       // optional
seasonality
short_description
status
```

Possible types include:

```text
HAOR
LAKE
RIVER
BEEL
FOREST_WATERWAY
CONFLUENCE
OTHER
```

A water body may connect to multiple Places and, where necessary, multiple districts.

---

# 9. Initial Water-Tourism Market Map

The following examples guide seeding and provider research. They do not change the nationwide rule that every district shows both water-service options.

| District / Market | Division | Water Body / Tourism Area | Expected Early Pattern |
|---|---|---|---|
| Sunamganj | Sylhet | Tanguar Haor | Houseboats + Small Boats |
| Kishoreganj | Dhaka | Nikli Haor | Small Boats; Houseboat option still visible |
| Rangamati | Chattogram | Kaptai Lake | Houseboats + Small Boats |
| Chandpur | Chattogram | Padma–Meghna–Dakatia confluence | Mainly Small Boats / day water trips |
| Khulna / Bagerhat | Khulna | Sundarbans waterways | Water tours; special Small Boat one-day rule |
| Natore and connected areas | Rajshahi | Chalan Beel / Halti Beel | Mainly Small Boats, seasonal |

This table is an initial product-research map, not a promise of launch inventory.

---

# 10. Product Epicenter: Place Page

The Place Page is the core traveler screen.

It should answer:

```text
What is this Place?
Where is it?
When should I visit?
How do I reach it?
What should I know?
What else is nearby?
Can I add it to my trip?
Can TourismuBD plan a route with it?
Which Guides cover it?
What water options are relevant to the district?
```

Primary actions:

```text
[ + Add to My Trip ]
[ Plan This Trip ]
```

Secondary actions may include:

```text
Save
Share
View Map
```

A Facebook-style social timeline must not replace this epicenter.

---

# 11. Place Data Requirements

Each published Place should support:

```text
id
name
slug
district_id
upazila_or_area
category
latitude
longitude
short_description
status
last_verified_at
created_at
updated_at
```

Traveler-facing launch information should include:

- canonical name,
- useful photos,
- short practical description,
- coordinates/map location,
- district and area,
- category,
- Best Time guidance,
- How to Reach information,
- warnings/tips where relevant,
- nearby Places,
- route relationship data,
- last verified date.

Optional fields may include:

- opening time,
- closing time,
- entry fee,
- average visit duration,
- parking information,
- road condition,
- accessibility,
- crowd note,
- food availability.

Optional fields must not block launch unnecessarily.

---

# 12. Place Photos

## 12.1 Curated Photos

TourismuBD's seeded Place pages may use curated photos only when TourismuBD has permission or an appropriate right to use them.

Do not use random scraped images.

## 12.2 Future Traveler Media

Traveler experiences may later attach media to:

```text
post.place_id
```

Traveler content supports a Place; it does not create a new Place identity.

A full social posting system is not required for the core MVP.

---

# 13. Best Time to Visit

V1 uses:

> **Admin-curated Best Time guidance**

Do not initially build:

- community voting algorithms,
- AI-generated seasonal recommendations,
- Bayesian confidence scoring,
- complex weather-history scoring.

Example display:

```text
BEST TIME TO VISIT

Recommended:
November – March

Why:
Lower rainfall and comfortable weather.

Avoid / Be Careful:
Heavy rain may make access difficult.

Last Verified:
August 2026

[ Suggest an Update ]
```

Travelers and providers may suggest corrections, but suggestions require Admin review before changing canonical guidance.

---

# 14. Traveler Home

The Home screen should lead directly to travel planning.

Recommended structure:

```text
TOURISMUBD

Where do you want to go?
[ Search Places ]

Explore a District
[ Select District ]

Plan a Trip
[ Select Places ]

Explore by Water
[ Find a Houseboat ]
[ Rent a Small Boat ]

Popular Places
...
```

Primary choices:

1. Find a Place
2. Plan Selected Places
3. Explore a District
4. Find a Houseboat
5. Rent a Small Boat

---

# 15. Place Search and Explore

Traveler can search by:

- Place name,
- Place alias,
- category,
- district,
- area.

Search must return canonical Place records rather than random user posts.

A district page should contain:

- featured Places,
- categories,
- trip-planning entry point,
- route suggestions where available,
- **Explore by Water** with both standard water buttons.

---

# 16. Nearby Place Discovery

User need:

> **“I know one Place. What else can I visit nearby?”**

Flow:

```text
Search Place
    ↓
Place Page
    ↓
Nearby Places
    ↓
View / Add to Trip
```

Nearby should prioritize practical travel relationships such as:

- road distance,
- approximate travel time,
- route accessibility,

rather than straight-line geographic distance alone.

Initial relationship data may be manually researched.

Suggested relationship fields:

```text
id
from_place_id
to_place_id
road_distance
approx_travel_time
transport_type
seasonal_note
last_verified_at
```

---

# 17. Trip Object

A traveler can create a trip containing canonical Places.

Example:

```text
MY SYLHET TRIP

Ratargul
Jaflong
Lalakhal
```

Suggested structure:

```text
saved_trips

id
traveler_id
name
starting_point_type
starting_point_value
created_at
updated_at
```

and:

```text
saved_trip_places

id
saved_trip_id
place_id
sequence
day_number
```

---

# 18. Route Planning Modes

TourismuBD supports three core planning situations.

## 18.1 Mode 1 — Nearby Discovery

> “I know one Place. What else is nearby?”

```text
Search Place
→ Place Page
→ Nearby Places
→ Add to Trip
```

## 18.2 Mode 2 — Selected Places Route

> “I know where I want to go. What order should I visit?”

```text
Select Places
→ Choose Starting Point
→ Generate Recommended Sequence
→ View Route
→ Save Trip
```

For the first strong use case, optimize approximately 2–5 Places.

## 18.3 Mode 3 — Explore Whole District

> “I am going to this district. Help me organize the trip.”

```text
Select District
→ Select Number of Days
→ Select / use curated important Places
→ Group nearby Places
→ Order groups
→ Create day-by-day sequence
```

The district planner should produce a practical highlights itinerary, not force every known attraction into a trip.

---

# 19. Starting Point

Support starting points such as:

- current location,
- city center,
- railway station,
- airport,
- bus terminal,
- hotel,
- custom location.

When the traveler knows their real starting point, the route should optimize from that point.

---

# 20. Route Output

A generated route should show:

- ordered Place list,
- map visualization,
- approximate travel distance where available,
- approximate travel time where available,
- transport note where useful,
- seasonal note where relevant.

Example:

```text
START
Sylhet City
   ↓
1. Place A
   ↓
2. Place B
   ↓
3. Place C
```

TourismuBD should reduce obvious backtracking rather than over-promise mathematical perfection.

---

# 21. Route Logic

For small selected sets, V1 may use:

- manually verified route relationships,
- road distance/time data,
- simple route permutations for small N,
- simple greedy ordering,
- curated route templates,
- human-reviewed outputs.

Do not make AI a dependency.

For district plans, begin with curated 1-day, 2-day, and 3-day templates and improve dynamic logic only when real usage demonstrates the need.

---

# 22. Provider Architecture

TourismuBD uses a shared provider framework with distinct provider/service types.

Current product provider types are:

```text
TOUR GUIDE
HOUSEBOAT OWNER
SMALL BOAT OWNER
```

Future provider types may include:

```text
RESORT / HOTEL
CAR / TRANSPORT
PARKING
TOUR HOST ORGANIZATION
TOUR PACKAGE
```

Future types must not complicate the current implementation before they are needed.

---

# 23. Tour Guide Marketplace

## 23.1 Guide Discovery

Guides may appear:

- on relevant Place pages,
- after a route is generated,
- in district Guide search.

For a planned route, prioritize how much of the selected route the Guide covers.

Example:

```text
GUIDES FOR YOUR ROUTE

Karim
Covers 3 / 3 Places
4.8 ★ · 12 Verified Reviews

Hasan
Covers 2 / 3 Places
4.6 ★ · 8 Verified Reviews
```

Secondary factors may include:

- availability,
- average rating,
- verified review count.

No complex ranking formula is required.

## 23.2 Guide Profile

Before booking confirmation, show:

- name,
- photo,
- Identity Verified status,
- bio/experience,
- Places covered,
- areas covered,
- languages,
- approximate rate,
- basic availability,
- average rating,
- verified review count,
- verified reviews,
- Request Guide action.

Phone/email must remain hidden before confirmation.

## 23.3 Guide Onboarding

Collect the minimum information required:

- name,
- email,
- Bangladesh phone number,
- profile photo,
- bio,
- languages,
- Places covered,
- approximate rate,
- availability,
- NID / identity document for private Admin review.

A Guide cannot become bookable before approval.

## 23.4 Guide Subscription

The Tour Guide monthly subscription is:

> **৳10/month**

When Guide subscriptions are active, a Guide must maintain the monthly subscription to remain eligible for new discovery and new booking requests. Existing Confirmed bookings must not be automatically cancelled solely because the Guide subscription expires.

---

# 23A. Full TourismuBD Provider Catalog

TourismuBD is designed to support multiple tourism provider types over time. **Getting Real changes the build order, not the long-term provider vision.**

The defined provider catalog is:

```text
Tour Guide
Houseboat Owner
Small Boat Owner
Resort / Hotel Owner
Car / Transport Owner
Parking Owner
Tour Agency / Tour Host Organization
```

Only the provider marketplaces explicitly included in the current launch phase are launch blockers. The remaining types stay documented so future engineering does not mistake them for removed product ideas.

## 23A.1 Resort / Hotel Owner

A Resort / Hotel Owner will be able to:

- create a provider account and complete Admin verification,
- create one or more accommodation listings,
- add photos, location, description, facilities, approximate pricing, and basic availability,
- receive traveler booking requests,
- accept or decline requests,
- reveal contact information after a booking is Confirmed,
- receive verified reviews after Completed TourismuBD bookings,
- participate in the shared provider subscription framework when this marketplace is activated.

The first Resort version should avoid building a full hotel-grade room inventory engine unless real usage proves it necessary.

## 23A.2 Car / Transport Owner

A Car / Transport Owner will be able to:

- create a provider account and complete Admin verification,
- list one or more vehicles/services,
- provide vehicle type, passenger capacity, service area, pickup information, approximate rate, and availability,
- receive booking requests,
- accept or decline requests,
- reveal contact information after confirmation,
- receive verified reviews after Completed bookings,
- participate in the shared provider subscription framework when this marketplace is activated.

Do not build bidding, dispatch optimization, live driver tracking, or ride-hailing behavior unless later research proves they are needed.

## 23A.3 Parking Owner

A Parking Owner will be able to:

- create a provider account and complete Admin verification,
- list parking locations near relevant tourist Places,
- provide location, supported vehicle types, approximate capacity, operating hours, rate, and basic availability,
- receive booking requests if pre-booking is enabled for that market,
- reveal contact information after confirmation where booking is used,
- receive verified reviews after Completed TourismuBD bookings,
- participate in the shared provider subscription framework when this marketplace is activated.

Parking remains a lower-priority marketplace until traveler research shows strong demand.

## 23A.4 Tour Agency / Tour Host Organization

A Tour Agency / Tour Host Organization is a provider account for an agency/company rather than an individual Guide.

It will be able to:

- create an organization profile and complete Admin verification,
- list districts and canonical Places covered,
- create one or more tour packages,
- define package name, itinerary, Places included, duration, approximate price, traveler capacity, and availability,
- receive booking requests,
- accept or decline requests,
- reveal organization contact information after confirmation,
- receive verified reviews after Completed TourismuBD bookings,
- participate in the shared provider subscription framework when this marketplace is activated.

An individual Tour Guide and a Tour Agency / Tour Host Organization remain separate provider types unless a later product decision introduces staff/guide linking.

## 23A.5 Fixed Monthly Subscription Schedule

The shared provider subscription system must support the following fixed monthly fees:

| Provider Type | Monthly Subscription |
|---|---:|
| **Tour Guide** | **৳10/month** |
| **Houseboat Owner** | **৳100/month** |
| **Small Boat Owner** | **৳50/month** |
| **Resort / Hotel Owner** | **৳100/month** |
| **Car / Transport Owner** | **৳50/month** |
| **Parking Owner** | **৳30/month** |
| **Tour Agency / Tour Host Organization** | **৳70/month** |

These prices are explicit product decisions and must not be replaced with TBD values. A later-phase provider is charged only when that provider marketplace/account type is activated for real use; defining its fee now does not make that marketplace a V1 launch blocker.

---

# 24. Explore by Water — Nationwide Product Rule

Every district page must show:

```text
EXPLORE BY WATER

[ Find a Houseboat ]

[ Rent a Small Boat ]
```

This is one consistent nationwide UI pattern.

## 24.1 Houseboat Button

Opening **Find a Houseboat** shows verified Houseboat listings filtered to the selected district / relevant service area.

If none exist:

```text
No verified Houseboats are available here yet.
```

## 24.2 Small Boat Button

Opening **Rent a Small Boat** shows verified Small Boat listings filtered to the selected district / relevant service area.

If none exist:

```text
No verified Small Boats are available here yet.
```

## 24.3 Do Not Hide Empty Categories

Even when a market currently has no Houseboats or no Small Boats, the two standard options remain visible.

This gives TourismuBD a consistent nationwide product vocabulary.

---

# 25. Houseboat Owner Account

A user may register as:

> **Houseboat Owner**

A Houseboat Owner may manage one or more Houseboat listings, subject to product limits and Admin approval.

Required onboarding information should include:

- owner/operator name,
- email,
- Bangladesh phone number,
- NID / identity document,
- profile/business name,
- operating district/area,
- relevant water body/area,
- boarding point,
- photos,
- description,
- capacity,
- approximate price,
- facilities,
- availability.

The profile/listing remains non-bookable until Admin completes the verification workflow.

If TourismuBD only validates identity/profile consistency, use:

> **Identity Verified ✓**

Do not call the provider Business Verified without business-document verification.

---

# 26. Houseboat Listing

A minimum useful Houseboat listing should show:

```text
Houseboat Name
Photos
Identity Verified status
District / Operating Area
Water Body / Route Area
Boarding Point
Places / Routes Served
Traveler Capacity
Approximate Price
Pricing Unit
Facilities
Availability
Important Rules / Notes
Average Rating
Verified Review Count

[ Request Booking ]
```

The first version must not become a hotel-grade accommodation engine.

Do not require:

- dynamic room pricing,
- OTA-style inventory management,
- automated deposits,
- payout wallet,
- refund engine,
- complex room allocation,

unless later real provider usage proves they are necessary.

---

# 27. Houseboat Booking Duration — Nationwide Rule

This is a hard product rule:

> **Houseboat travelers can choose how many days they want to book anywhere in Bangladesh. There is no district-specific duration exception.**

The traveler selects:

- start date,
- number of days,
- number of travelers,
- optional note.

Example:

```text
HOUSEBOAT BOOKING

Start Date:
[ Select Date ]

Number of Days:
[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5+ ]

Travelers:
[ 8 ]

[ Send Booking Request ]
```

Implementation rule:

```text
houseboat_duration_days >= 1
```

There is **no TourismuBD district rule** that forces Houseboat duration to one day.

The request remains subject to the Houseboat Owner's actual availability.

---

# 28. Small Boat Owner Account

A user may register as:

> **Small Boat Owner**

Required onboarding information should include:

- owner/operator name,
- email,
- Bangladesh phone number,
- NID / identity document,
- operating district/area,
- water body/area,
- boarding point,
- boat photo(s),
- capacity,
- approximate price,
- pricing unit,
- basic availability,
- relevant rules/notes.

A Small Boat listing cannot become bookable before Admin approval.

Use the same precise trust rule:

> **Identity Verified ✓**

when the defined identity process is complete.

---

# 29. Small Boat Listing

A minimum useful Small Boat listing should show:

```text
Boat Name / Identifier
Photos
Identity Verified status
District / Operating Area
Water Body / Area
Boarding Point
Capacity
Approximate Price
Pricing Unit
Availability
Important Rules / Notes
Average Rating
Verified Review Count

[ Request Booking ]
```

Possible pricing units may include per day or per trip depending on the provider.

The booking duration rule is controlled by the market rule in the next section.

---

# 30. Small Boat Booking Duration Rules

## 30.1 Sundarbans — Fixed One Day

For **Small Boat bookings in the Sundarbans**, TourismuBD must enforce:

> **Duration = 1 Day**

The traveler does not select 2, 3, 4, or more days for a Sundarbans Small Boat booking.

Example:

```text
SMALL BOAT — SUNDARBANS

Date:
[ Select Date ]

Duration:
1 Day — Fixed

Travelers:
[ Select ]

[ Send Booking Request ]
```

This rule should be tied to the service area's classification as **Sundarbans**, not merely to one district name, because the Sundarbans tourism area can involve more than one district/boarding market.

## 30.2 All Other Districts / Markets — Traveler Selects Days

Outside the Sundarbans, Small Boat travelers can select the number of days they want.

Examples:

```text
1 Day
2 Days
3 Days
4 Days
5+ Days
```

subject to provider availability.

Implementation rule:

```text
IF service_area = SUNDARBANS:
    duration_days = 1
ELSE:
    duration_days >= 1, selected by traveler
```

There is no other district exception currently defined.

---

# 31. Water Provider / Place Connections

Houseboat and Small Boat listings should connect to structured geography.

Possible relationships:

```text
boat_listing_districts
boat_listing_water_bodies
boat_listing_places
```

Example:

```text
Houseboat A
District: Sunamganj
Water Body: Tanguar Haor
Places / Areas Served:
- Teker Ghat
- Jadukata area
- relevant route points
```

Do not depend only on uncontrolled free-text destination names when canonical IDs exist.

---

# 32. Booking Marketplace Lite

TourismuBD uses one simple booking principle for Guide, Houseboat, and Small Boat services.

```text
Traveler Finds Provider / Listing
        ↓
Views Public Information
        ↓
Sends Booking Request
        ↓
Provider Accepts / Declines
        ↓
If Accepted: Confirmed
        ↓
Contact Details Unlock
        ↓
Traveler + Provider Coordinate Directly
        ↓
Trip / Service Happens
        ↓
Completed
        ↓
Verified Review
```

The system is a booking-record marketplace, not merely a public phone directory.

---

# 33. Booking Statuses

Use the same simple statuses across supported provider types:

```text
Pending
Confirmed
Completed
Cancelled
```

## Pending

Traveler sent a request; provider has not accepted or declined.

## Confirmed

Provider accepted.

At confirmation:

- booking record remains in TourismuBD,
- provider contact becomes visible to the traveler,
- necessary traveler contact may become visible to the provider with consent.

## Completed

The service happened.

Completed status enables review eligibility.

## Cancelled

The service will not happen.

Store:

- cancelled by,
- optional reason,
- cancellation time.

Do not build complex cancellation fees in the first version.

---

# 34. Contact Visibility

This is a core marketplace rule:

> **Discovery is public. Contact is unlocked by a confirmed booking.**

Before confirmation, travelers may see:

- public profile/listing,
- photos,
- coverage/area,
- price/rate,
- availability,
- ratings/reviews,
- Identity Verified status.

Before confirmation, travelers must not see:

- provider phone number,
- provider email,
- NID/private verification documents.

After confirmation, TourismuBD may reveal:

- provider phone,
- provider email,
- necessary coordination details.

No in-app chat is required for the first version.

---

# 35. Marketplace Payment

TourismuBD does not need to process the traveler-to-provider service payment in the first Booking Marketplace Lite version.

After confirmation:

```text
Traveler + Provider
        ↓
Coordinate directly
        ↓
Arrange service payment outside TourismuBD
```

Do not initially build:

- escrow,
- marketplace wallet,
- provider payouts,
- booking commission calculation,
- automated refunds,
- transaction reconciliation.

This rule does **not** prevent TourismuBD from collecting provider subscription fees.

---

# 36. Provider Subscription System

Provider subscriptions are an explicit business rule.

## 36.1 Monthly Pricing

| Provider Account Type | Monthly Subscription |
|---|---:|
| **Tour Guide** | **৳10/month** |
| **Houseboat Owner** | **৳100/month** |
| **Small Boat Owner** | **৳50/month** |
| **Resort / Hotel Owner** | **৳100/month** |
| **Car / Transport Owner** | **৳50/month** |
| **Parking Owner** | **৳30/month** |
| **Tour Agency / Tour Host Organization** | **৳70/month** |

These values are fixed product requirements until intentionally revised.

Do not replace them with TBD pricing in implementation documentation. Later-phase provider fees become collectible when the corresponding provider marketplace/account type is activated.

## 36.2 Subscription Purpose

An active subscription keeps the provider account/listing eligible for:

- discovery,
- new booking requests,
- accepting new bookings,
- active public listing status.

## 36.3 Subscription State

Use a simple state model:

```text
Active
   ↓
Payment Due / Grace Period
   ↓
Frozen
   ↓
Payment Confirmed
   ↓
Active
```

An initial **3-day grace period** may be used, consistent with the earlier TourismuBD subscription design, unless the business intentionally changes it later.

## 36.4 Frozen Provider Rule

When a paid provider becomes Frozen because subscription payment is overdue:

- the provider should not receive new booking requests,
- the listing may be hidden from normal results or marked unavailable,
- the provider cannot accept new bookings,
- the provider can access the payment/reactivation path.

**Existing Confirmed bookings must not be automatically cancelled merely because the provider subscription expired.**

The Admin may intervene if the provider cannot fulfill an existing booking.

## 36.5 Initial Payment Operation

Keep subscription collection operationally simple at first.

Admin may manually verify subscription payment and update subscription state.

Do not build sophisticated recurring-billing automation until real volume justifies it.

## 36.6 Subscription Unit

The subscription is associated with the provider account type.

A provider's exact listing-count limits may be configured later; do not introduce per-listing fees unless explicitly approved in a future product decision.

The monthly subscription is per provider account unless a later explicit product decision changes the billing unit.

---

# 37. Ratings and Reviews

Only a traveler linked to a **Completed TourismuBD booking** may review the booked provider/listing.

Review format:

```text
★★★★★
Optional Comment
```

Rules:

- one review per completed booking,
- rating is 1–5 stars,
- comment is optional,
- traveler may skip review,
- no anonymous unlinked reviews,
- review references `booking_id`,
- provider cannot delete an unfavorable review,
- Admin may remove a review for a clear policy reason.

Display:

```text
4.8 ★
18 Verified Reviews
```

For a new provider:

```text
No verified reviews yet
```

Do not show `0.0 ★`.

No multi-dimensional Behavior / Facilities / Safety formula is required.

---

# 38. Trust and Verification

## 38.1 Public Label

Use:

> **Identity Verified ✓**

when the defined checks are completed.

## 38.2 Identity Verification Process

A simple provider process may include:

- email verified,
- NID/identity document submitted,
- Admin checks identity/profile consistency,
- Admin checks submitted service information,
- Admin contacts the submitted phone number,
- Admin approves/rejects/requests correction.

The exact public claim must match what actually happened.

## 38.3 Identity Verified Does Not Mean

It does not guarantee:

- personal safety,
- future conduct,
- professional competence,
- service quality,
- criminal-history status,
- government certification,
- legal business registration,
- every self-reported claim.

## 38.4 Sensitive Documents

NID and verification documents must:

- remain private,
- never appear publicly,
- use private storage,
- be accessible only to authorized Admin users,
- have a defined retention/privacy policy before broad launch.

---

# 39. Reports and Safety Operations

V1 should use a basic human-operated reporting system.

Possible report categories:

```text
Provider Problem
Booking Problem
Safety Concern
Fraud / Misrepresentation
Review Problem
Other
```

Flow:

```text
User Reports
   ↓
Admin Reviews Booking / Profile / Evidence
   ↓
Admin Contacts Parties if Needed
   ↓
Admin Decision
```

Possible actions:

- no action,
- warning,
- correct booking state,
- hide listing,
- suspend provider,
- remove provider,
- remove review.

Do not create automatic fraud/blacklist scoring in the initial version.

---

# 40. Admin / Operations Model

TourismuBD must be operable by approximately:

> **1–3 people**

Do not design separate departments for verification, support, payments, moderation, and fraud at launch.

One founder may temporarily be:

```text
Admin
+
Support
+
Verification
+
Moderation
```

The system should help that person work efficiently.

## 40.1 Super Admin / Owner Admin — Full A–Z Authority

The TourismuBD founder/owner Admin is the **Super Admin** and has full application authority.

> **SUPER_ADMIN has A–Z access across the entire TourismuBD application.**

The Super Admin can create, view, edit, approve, reject, publish, unpublish, hide, suspend, reactivate, restore, remove, and permanently delete application records when operationally necessary.

This authority applies across:

- traveler accounts,
- provider accounts,
- provider verification records,
- Tour Guides,
- Houseboat Owners and listings,
- Small Boat Owners and listings,
- Resort / Hotel Owners and listings,
- Car / Transport Owners and listings,
- Parking Owners and listings,
- Tour Agencies / Tour Host Organizations and listings/packages,
- canonical Places,
- districts and service areas,
- water bodies,
- Best Time information,
- How to Reach information,
- Place photos/content,
- nearby relationships,
- route data and curated routes,
- saved-trip operational records when support requires it,
- bookings and booking status,
- reviews and ratings,
- reports / complaints,
- subscription records and payment status,
- application configuration used by Admin operations,
- moderation states,
- notification/support records where implemented,
- audit/history records subject to the audit-protection rule below.

The Super Admin is **not restricted by normal Traveler or Provider ownership rules**. Row Level Security and server-side authorization must explicitly permit the authenticated `SUPER_ADMIN` role to perform authorized administrative operations across application data.

### 40.1.1 Full Control Does Not Mean Accidental Control

Full authority must include basic safety against mistakes:

- destructive actions such as permanent deletion require a confirmation step;
- high-impact actions should display the target record clearly before execution;
- sensitive actions must be written to the Admin audit log;
- soft delete / restore should be preferred where practical;
- permanent hard delete remains available to Super Admin where legally and technically appropriate;
- deleting one record must not silently corrupt required relational data.

These protections do **not** reduce Super Admin authority. They reduce accidental damage.

### 40.1.2 Future Staff Admins

TourismuBD may later introduce limited staff roles such as Support Admin, Verification Admin, or Content Admin. Those future roles may have restricted permissions.

The founder/owner `SUPER_ADMIN` remains the highest-authority role and is not limited by those staff-role restrictions.

---

# 41. Admin Work Queues

The Admin interface should behave like a work queue, not an executive analytics suite.

Recommended queues:

## 41.1 Provider Verification

The Admin Panel must support verification for every provider marketplace that is currently activated.

Initial active verification queues include:

- Tour Guide applications,
- Houseboat Owner applications,
- Small Boat Owner applications.

When later provider marketplaces are activated, the same Admin Panel must also support:

- Resort / Hotel Owner applications,
- Car / Transport Owner applications,
- Parking Owner applications,
- Tour Agency / Tour Host Organization applications.

Actions:

- approve,
- reject,
- needs correction,
- suspend/remove after launch.

## 41.2 Place / Route Data

Admin can:

- create/edit/publish/hide Places,
- manage Best Time,
- manage How to Reach,
- manage route/nearby relationships,
- review correction suggestions.

## 41.3 Booking / Provider Reports

Admin can:

- view booking,
- view provider/listing,
- read report,
- add notes,
- contact parties,
- correct status,
- warn/suspend/remove provider.

## 41.4 Review Moderation

Admin can:

- view reported review,
- verify related booking,
- keep review,
- remove review.

## 41.5 Subscription Operations

The Admin Panel must support subscription operations for every provider type whose marketplace/subscription is active.

Fixed monthly fees are:

| Provider Type | Monthly Subscription |
|---|---:|
| Tour Guide | ৳10/month |
| Houseboat Owner | ৳100/month |
| Small Boat Owner | ৳50/month |
| Resort / Hotel Owner | ৳100/month |
| Car / Transport Owner | ৳50/month |
| Parking Owner | ৳30/month |
| Tour Agency / Tour Host Organization | ৳70/month |

Admin can:

- view subscription state,
- record/verify payment,
- view the provider type and required monthly fee,
- activate,
- place in grace period,
- freeze,
- reactivate,
- view payment history/notes.

A subscription problem must not automatically cancel an already Confirmed traveler booking.

## 41.6 Admin Panel Required Screens

The Admin Panel is a **required application surface**, not an optional future dashboard.

Minimum operational screens:

```text
Admin Dashboard
├── Provider Verification
├── Provider Accounts / Listings
├── Places / Best Time / How to Reach
├── Nearby / Route Data
├── Bookings
├── Subscriptions
├── Reports / Complaints
├── Review Moderation
├── Users / Account Status
└── Admin Action Log
```

### Admin Dashboard

Show small operational counts such as:

- provider applications waiting for review,
- open reports/complaints,
- bookings needing Admin attention,
- subscriptions in Payment Due / Grace / Frozen state,
- Place correction suggestions waiting for review.

Do not turn V1 into a large business-intelligence dashboard. The purpose is to help a 1–3 person team know **what needs action now**.

### Provider Accounts / Listings

Admin can:

- search/filter providers by provider type, district, verification status, account status, and subscription state,
- open a provider profile/listing,
- review private verification documents when authorized,
- approve/reject/request correction,
- publish/hide/suspend/reactivate the provider or listing when permitted,
- see related bookings, reviews, reports, and subscription status.

### Bookings

Admin can:

- search/filter bookings,
- inspect traveler/provider/listing references,
- inspect booking status history,
- correct a booking status when operationally necessary,
- add an internal note,
- see related reports.

Admin must not casually edit completed history; sensitive corrections require an audit-log entry.

### Users / Account Status

Admin can:

- search users/providers,
- view basic account status,
- suspend/reactivate an account for a documented reason,
- view reports connected to the account.

Private identity documents remain restricted to authorized Admin access.

---

# 42. Admin Action Logging

Sensitive Admin actions should record:

```text
who
what
when
why
```

Suggested table:

```text
admin_actions

id
admin_user_id
entity_type
entity_id
action
reason
created_at
```

Examples:

```text
PROVIDER_APPROVED
PROVIDER_REJECTED
PROVIDER_SUSPENDED
PLACE_UPDATED
BOOKING_STATUS_CORRECTED
REVIEW_REMOVED
SUBSCRIPTION_FROZEN
SUBSCRIPTION_REACTIVATED
REPORT_RESOLVED
```

Human-first does not mean undocumented.

---

# 43. Authentication

## 43.1 Application Roles

The authorization model must support at least:

```text
TRAVELER
TOUR_GUIDE
HOUSEBOAT_OWNER
SMALL_BOAT_OWNER
RESORT_HOTEL_OWNER        // when activated
CAR_TRANSPORT_OWNER       // when activated
PARKING_OWNER             // when activated
TOUR_AGENCY               // when activated
SUPER_ADMIN
```

`SUPER_ADMIN` is the owner-level administrative role with full A–Z application access as defined in Section 40.1.

Traveler authentication should be simple and sufficient for:

- saving trips,
- booking providers,
- reviews,
- reports,
- update suggestions.

Technical direction:

- email/password,
- Google sign-in,
- Supabase Auth.

Provider onboarding additionally requires:

- verified account email,
- Bangladesh phone number,
- identity verification workflow.

Avoid unnecessary onboarding steps.

---

# 44. Notifications

Only core notifications are required initially.

Traveler:

- provider accepted,
- provider declined,
- booking cancelled,
- subscription-related provider unavailability if it affects a request.

Provider:

- new booking request,
- traveler cancelled,
- subscription due/grace/frozen/reactivated.

Admin:

- new provider application,
- new report,
- subscription payment requiring review where manual.

Do not build a large notification-preference system initially.

---

# 45. Seeding Before Launch

TourismuBD must create initial value before asking users to create it.

For each launched district/market, seed:

- useful Places,
- good photos,
- Best Time guidance,
- How to Reach information,
- practical tips,
- nearby relationships,
- route relationships,
- curated trip templates,
- real provider profiles where available.

For Sylhet initial launch, target approximately:

> **8–12 excellent complete Place pages**

and approximately:

> **5–10 real Guides**

Do not create fake providers, fake bookings, fake reviews, or fake ratings.

For water-market expansion, onboard real Houseboat/Small Boat providers market by market.

---

# 46. Water Provider Empty-State Rule

Because every district always shows both water options, empty states are a first-class feature.

Examples:

```text
FIND A HOUSEBOAT

No verified Houseboats are available in this district yet.

[ Notify / Check Again Later ]   // optional later
```

```text
RENT A SMALL BOAT

No verified Small Boats are available in this district yet.
```

Do not create fake inventory just to avoid an empty screen.

---

# 47. Conceptual Data Model

A likely PostgreSQL/Supabase model includes:

```text
users

districts

places
place_aliases
place_photos
place_best_time
place_access
place_relationships

water_bodies
water_body_places

saved_trips
saved_trip_places

guide_profiles
guide_places
guide_availability

provider_verifications

houseboat_owner_profiles
houseboat_listings
houseboat_places
houseboat_water_bodies
houseboat_availability

small_boat_owner_profiles
small_boat_listings
small_boat_places
small_boat_water_bodies
small_boat_availability

provider_subscriptions
provider_subscription_payments

bookings
reviews
reports
place_update_suggestions
admin_actions
```

Exact names may change during implementation, but the product rules must remain intact.

---

# 48. Core Table Responsibilities

## `districts`

Canonical district definitions and division relation.

## `places`

Canonical tourist destinations.

## `place_aliases`

Alternative searchable names, including Bangla aliases.

## `place_relationships`

Nearby and practical route relationships.

## `water_bodies`

Canonical water-tourism areas where structured water geography is useful.

## `guide_profiles`

Guide public profiles.

## `guide_places`

Guide-to-Place coverage.

## `provider_verifications`

Private verification workflow for supported providers.

## `houseboat_owner_profiles`

Houseboat provider accounts.

## `houseboat_listings`

Bookable Houseboats.

## `small_boat_owner_profiles`

Small Boat provider accounts.

## `small_boat_listings`

Bookable Small Boats.

## `provider_subscriptions`

Subscription state for paid provider account types.

Must support the fixed provider schedule:

```text
GUIDE = ৳10/month
HOUSEBOAT_OWNER = ৳100/month
SMALL_BOAT_OWNER = ৳50/month
RESORT_HOTEL_OWNER = ৳100/month
CAR_TRANSPORT_OWNER = ৳50/month
PARKING_OWNER = ৳30/month
TOUR_AGENCY_ORGANIZATION = ৳70/month
```

## `bookings`

Shared booking records for Guide, Houseboat, and Small Boat.

## `reviews`

One verified review per completed booking.

## Future Provider Tables — Not Required for Initial V1

When later provider marketplaces are activated, the data model may add subtype tables such as:

```text
resort_hotel_owner_profiles
resort_hotel_listings

transport_owner_profiles
vehicle_listings

parking_owner_profiles
parking_listings

tour_organization_profiles
tour_packages
tour_package_places
```

Do not build these tables merely because they are listed here. Add them when the corresponding marketplace phase starts and the real workflow is understood.

---

# 49. Suggested Provider Fields

A shared provider base may use:

```text
provider_id
user_id
provider_type
verification_status
account_status
phone
email
created_at
updated_at
```

Possible `provider_type` values:

```text
GUIDE
HOUSEBOAT_OWNER
SMALL_BOAT_OWNER
RESORT_HOTEL_OWNER
CAR_TRANSPORT_OWNER
PARKING_OWNER
TOUR_AGENCY_ORGANIZATION
```

Only the provider types activated for the current release need complete subtype tables and booking UI. The remaining enum values may be reserved or introduced when their marketplace phase begins.

The implementation may use separate subtype tables for service-specific fields.

---

# 50. Suggested Booking Fields

The booking model must support multiple provider types without remaining Guide-only.

Suggested structure:

```text
id
traveler_id
provider_type
provider_id
listing_id             // nullable for Guide, required for boat listing
saved_trip_id          // optional
primary_place_id       // optional
water_body_id          // optional
start_date
duration_days
traveler_count
preferred_language     // Guide optional
note
status
cancelled_by           // optional
cancellation_reason    // optional
created_at
updated_at
```

Validation examples:

```text
HOUSEBOAT:
    duration_days >= 1

SMALL_BOAT + SUNDARBANS:
    duration_days = 1

SMALL_BOAT + NON_SUNDARBANS:
    duration_days >= 1
```

The exact provider/listing polymorphism may be implemented using either explicit nullable subtype IDs or a safe provider/listing abstraction. Keep it understandable and enforceable with RLS.

---

# 51. Suggested Review Fields

```text
id
booking_id
traveler_id
provider_type
provider_id
listing_id          // optional where review is provider-level
rating
comment
status
created_at
```

Validation:

```text
rating ∈ {1,2,3,4,5}
booking belongs to traveler
booking.status = Completed
no previous review for booking
```

---

# 52. Suggested Subscription Fields

```text
provider_subscriptions

id
provider_id
provider_type
monthly_fee
status
current_period_start
current_period_end
grace_until
last_payment_at
created_at
updated_at
```

Pricing validation:

```text
IF provider_type = HOUSEBOAT_OWNER:
    monthly_fee = 100 BDT

IF provider_type = SMALL_BOAT_OWNER:
    monthly_fee = 50 BDT
```

Do not silently change these amounts in code.

---

# 53. Row-Level Access Requirements

## 53.1 Traveler

Can:

- browse public Places/providers/listings,
- manage own trips,
- create own booking requests,
- see own bookings,
- see provider contact only after their booking is Confirmed,
- review eligible Completed bookings,
- submit reports/suggestions.

Cannot:

- access provider NID/private verification data,
- edit canonical Place data,
- see provider contact before confirmation,
- review bookings belonging to someone else.

## 53.2 Guide

Can:

- manage own Guide profile,
- manage covered Places/availability,
- view own requests,
- accept/decline own requests,
- view necessary traveler contact after confirmation.

Cannot:

- approve own verification,
- view another provider's private data,
- delete reviews.

## 53.3 Houseboat Owner

Can:

- manage own provider profile,
- create/edit own Houseboat listings,
- manage own Houseboat availability,
- view own booking requests,
- accept/decline own booking requests,
- view traveler contact after confirmation,
- view own subscription state.

Cannot:

- approve own verification,
- edit another provider's listings,
- view unrelated bookings,
- delete reviews,
- access other providers' identity documents.

## 53.4 Small Boat Owner

Same ownership restrictions as Houseboat Owner, applied to Small Boat listings.

Small Boat Owner cannot override the Sundarbans one-day rule.

## 53.5 Admin

Can perform authorized operational actions required for:

- Places/routes,
- provider verification,
- provider suspension,
- booking support,
- review moderation,
- reports,
- subscriptions.

Sensitive identity data access must be limited to Admin users who need it.

---

# 54. Privacy Rules

At minimum:

- NID is never public,
- provider phone/email is hidden before confirmed booking,
- necessary traveler contact is shared only after confirmation and with appropriate product consent,
- verification documents use private storage,
- public trust language explains verification limits,
- account/data retention must be defined before broad public launch.

---

# 55. Technical Architecture

Keep the existing lightweight technical direction.

## 55.1 Frontend

- React
- Vite
- responsive mobile-first web application
- Capacitor may later wrap the same application for Android/iOS if needed

## 55.2 Backend / Platform

Primary platform:

> **Supabase / PostgreSQL**

Use:

- Supabase Auth,
- PostgreSQL,
- Supabase Storage,
- Row Level Security,
- Edge Functions where server-side logic is genuinely needed.

### Super Admin authorization requirement

Normal Traveler and Provider users remain restricted by ownership and role-based RLS policies.

The `SUPER_ADMIN` role must have explicit privileged policies/server-side authorization that permit full administrative access across the TourismuBD application, including create, read, update, moderation, restore, and delete operations. Privileged access must never be inferred only from a client-side UI flag.

Sensitive Super Admin operations must still use secure authenticated server-side authorization and audit logging.

Avoid standalone services until a real requirement requires them.

## 55.3 Storage

Public/controlled storage:

- Place photos,
- Guide photos,
- Houseboat photos,
- Small Boat photos.

Private storage:

- NID/identity verification documents.

## 55.4 Maps / Routing

The exact map/routing provider remains TBD and should be evaluated for:

- Bangladesh road coverage,
- travel-time quality,
- pricing,
- licensing,
- web/mobile compatibility,
- distance matrix capability where useful.

Do not hard-code the PRD to a provider before evaluation.

---

# 56. V1 / Product Scope

## 56.1 Must Have — Traveler Core

- signup/login when required,
- Place search,
- district explore,
- Place Page,
- Best Time,
- How to Reach,
- nearby Places,
- Add to My Trip,
- starting point,
- selected-Place route generation,
- route/map view,
- save trip,
- district/day trip flow,
- Guide discovery,
- Guide Booking Marketplace Lite,
- verified review flow,
- reports/suggestions.

## 56.2 Must Have — Water Layer

Every district page:

```text
[ Find a Houseboat ]
[ Rent a Small Boat ]
```

System support:

- Houseboat Owner account,
- Small Boat Owner account,
- provider verification,
- water listing search by district/service area,
- empty states,
- booking request,
- accept/decline,
- contact unlock after confirmation,
- completed review,
- subscription states,
- Houseboat ৳100/month,
- Small Boat ৳50/month,
- Houseboat multi-day nationwide,
- Sundarbans Small Boat fixed one day,
- non-Sundarbans Small Boat traveler-selectable multi-day.

## 56.3 Must Have — Admin

The Admin Panel is mandatory for launch operations.

The founder/owner Admin must have `SUPER_ADMIN` A–Z authority across the entire application.

- full create/view/edit/remove/delete authority for Super Admin,
- operational Admin Dashboard,
- provider verification queue,
- provider account/listing management,
- Place/Best Time/How to Reach management,
- nearby/route data management,
- booking support and status correction,
- report/complaint handling,
- review moderation,
- subscription management for every activated provider type,
- user/account status management,
- audit log for sensitive Admin actions.

---

# 57. Explicitly Out of Scope / Delayed

Unless a later explicit decision adds them, do not prioritize:

## Social

- Facebook-style primary feed,
- follow graph,
- creator ranking,
- advanced social notifications.

## Provider Expansion

The following provider types are **defined in the TourismuBD product architecture but delayed from the initial build**:

- full Resort/Hotel Owner marketplace,
- Car/Transport Owner marketplace,
- Parking Owner marketplace,
- Tour Agency/Tour Host Organization marketplace,
- restaurant marketplace.

Delayed means **not an initial-launch blocker**; it does not mean removed from TourismuBD.

## Communication

- WhatsApp-like in-app chat,
- negotiation engine,
- provider bidding marketplace.

## Traveler-to-Provider Payment

- escrow,
- platform wallet,
- provider payout,
- automated booking refunds,
- booking commission.

## Reviews / Ranking

- Behavior/Facilities/Safety weighted scores,
- Bayesian ranking,
- AI review summaries,
- sentiment analysis.

## Automation

- AI route planning,
- automated provider fraud scoring,
- automatic blacklist engine,
- advanced subscription billing automation before operational need.

## Advertising

- paid feed ads,
- advertiser dashboard,
- automated ad moderation,
- boosted listings.

---

# 58. Metrics

## 58.1 Traveler Value Metrics

- searches completed,
- Place pages viewed,
- nearby Places added,
- routes generated,
- routes saved,
- district plans generated,
- route completion/use feedback,
- D7/D30 retention where meaningful.

## 58.2 Guide Metrics

- verified Guides,
- Guide booking requests,
- acceptance rate,
- confirmed bookings,
- completed bookings,
- verified reviews.

## 58.3 Water Marketplace Metrics

Track separately for Houseboat and Small Boat:

- verified providers,
- active listings,
- districts with real supply,
- booking requests,
- acceptance rate,
- confirmed bookings,
- completed bookings,
- verified reviews,
- active subscriptions,
- frozen subscriptions,
- subscription renewal rate.

## 58.4 Operations Metrics

- pending verification count,
- verification turnaround,
- open reports,
- report resolution time,
- Place correction queue,
- manual subscription workload.

---

# 59. Launch and Expansion Plan

Getting Real means the architecture may support Bangladesh while launch operations remain narrow.

## Phase 1 — Sylhet Core

Prove:

```text
Place Discovery
→ Nearby Discovery
→ Route Planning
→ Save Trip
→ Guide Booking Lite
```

Seed approximately 8–12 excellent Sylhet Places and 5–10 real Guides.

The district page still uses the nationwide Explore by Water UI. If no verified water providers are available, show empty states rather than fake supply.

## Phase 2 — First Strong Water Market

Onboard real Houseboat and Small Boat providers in a strong water-tourism market.

Likely candidates from current product planning include:

- Sunamganj / Tanguar Haor,
- Rangamati / Kaptai Lake.

Reuse the same provider verification, booking, contact, review, and subscription foundation.

## Phase 3 — Additional Water Markets

Expand the same two standard water options into additional districts such as:

- Kishoreganj,
- Chandpur,
- Natore,
- Sundarbans-related Khulna/Bagerhat markets,

as real Place data and verified providers are available.

The Sundarbans Small Boat rule remains fixed to one day.

## Phase 4 — Other Defined Provider Marketplaces

Only after the core system demonstrates usage should TourismuBD activate the already-defined later provider marketplaces:

- Resort / Hotel Owners,
- Car / Transport Owners,
- Parking Owners,
- Tour Agencies / Tour Host Organizations,
- other services supported by later validated demand.

These provider types are part of the product roadmap even though their full booking workflows are not Phase 1 launch requirements.

---

# 60. Launch Readiness Criteria

## Places / Route

- [ ] Initial Place pages are complete and verified.
- [ ] Search works with canonical names/aliases.
- [ ] Nearby relationships are useful.
- [ ] Common route combinations are manually checked.
- [ ] Route output can be saved/reopened.
- [ ] Best Time and How to Reach information are present.

## Guides

- [ ] Real Guides onboarded.
- [ ] Verification works.
- [ ] Route/Place coverage works.
- [ ] Booking request/accept/decline works.
- [ ] Contact is hidden then unlocked correctly.
- [ ] Review eligibility works.
- [ ] Guide subscription price is configured as exactly ৳10/month when subscription enforcement is enabled.

## Water Layer

- [ ] Both water buttons appear on every district page.
- [ ] Empty states work honestly.
- [ ] Houseboat Owner onboarding works.
- [ ] Small Boat Owner onboarding works.
- [ ] Houseboat and Small Boat listing ownership/RLS works.
- [ ] Houseboat duration can be multi-day in every market.
- [ ] Sundarbans Small Boat duration is locked to 1 day.
- [ ] Non-Sundarbans Small Boat duration is traveler-selectable.
- [ ] Houseboat subscription is exactly ৳100/month.
- [ ] Small Boat subscription is exactly ৳50/month.
- [ ] Frozen subscription does not auto-cancel Confirmed bookings.

## Admin

- [ ] Admin Dashboard shows actionable operational queues.
- [ ] Provider applications can be reviewed.
- [ ] Active provider accounts/listings can be searched and managed.
- [ ] Places, Best Time, How to Reach, nearby data, and route data can be managed.
- [ ] Booking records can be inspected and supported.
- [ ] NID remains private and limited to authorized Admin access.
- [ ] Reports/complaints can be processed.
- [ ] Reviews can be moderated.
- [ ] Subscription status can be managed for every activated provider type.
- [ ] User/provider account status can be managed.
- [ ] Sensitive Admin actions are logged.

---

# 61. Core Acceptance Criteria

## AC-01 — Canonical Place

Multiple references to the same destination use the same canonical `place_id`.

## AC-02 — Place Search

Traveler can find a published Place by canonical name or alias.

## AC-03 — Nearby Places

Traveler can view useful nearby Places and add them to a trip.

## AC-04 — Best Time

Traveler sees Admin-curated Best Time guidance and can suggest an update.

## AC-05 — Route

Given selected Places and a starting point, TourismuBD returns a practical ordered route.

## AC-06 — Save Trip

Authenticated traveler can save/reopen a route.

## AC-07 — Guide Coverage

Guides can be matched to Places/routes using canonical Place IDs.

## AC-08 — Provider Verification

No Guide, Houseboat, or Small Boat provider becomes bookable before required approval.

## AC-09 — Trust Label

Identity Verified appears only when the defined identity process is complete.

## AC-10 — Contact Hidden

Provider phone/email is hidden before booking confirmation.

## AC-11 — Booking Request

Traveler can send a valid provider booking request.

## AC-12 — Accept / Decline

Provider can accept or decline a Pending request addressed to them.

## AC-13 — Contact Unlock

Confirmed booking reveals appropriate contact information to the booking parties.

## AC-14 — Completed Review

Only the traveler linked to a Completed booking can submit one review.

## AC-15 — Simple Review

Review uses 1–5 stars plus optional comment.

## AC-16 — Explore by Water Everywhere

Every district page displays both:

```text
[ Find a Houseboat ]
[ Rent a Small Boat ]
```

regardless of current inventory.

## AC-17 — Honest Empty State

If a water category has no verified listings in a district, TourismuBD shows an empty state rather than hiding the category or creating fake inventory.

## AC-18 — Houseboat Multi-Day Nationwide

For any Houseboat listing in Bangladesh, traveler can choose `duration_days >= 1` subject to availability; no district exception forces one day.

## AC-19 — Sundarbans Small Boat One-Day Rule

For a Small Boat listing serving the Sundarbans, `duration_days` is fixed to exactly 1.

## AC-20 — Other Small Boat Multi-Day Rule

For Small Boat listings outside the Sundarbans, traveler can select one or multiple days subject to provider availability.

## AC-21 — Houseboat Subscription

Houseboat Owner subscription is exactly **৳100/month**.

## AC-22 — Small Boat Subscription

Small Boat Owner subscription is exactly **৳50/month**.

## AC-22A — Other Provider Subscription Prices

The configured monthly subscription prices are exactly:

- Tour Guide — **৳10/month**
- Resort / Hotel Owner — **৳100/month**
- Car / Transport Owner — **৳50/month**
- Parking Owner — **৳30/month**
- Tour Agency / Tour Host Organization — **৳70/month**

These fees apply when the corresponding provider marketplace/account type is activated.

## AC-23 — Subscription Freeze Safety

Freezing a provider for unpaid subscription prevents new business but does not automatically cancel already Confirmed bookings.

## AC-24 — Sensitive Data Privacy

NID/private verification data is inaccessible from public and normal provider/traveler views.

## AC-25 — Admin Operability

A small Admin team can process provider verification, provider/listing management, reports, reviews, Place/route corrections, bookings, subscriptions for every activated provider type, and user/account status without requiring separate departments.

The Admin Panel provides operational access to the required work queues and sensitive Admin actions are audit logged.

## AC-26 — Super Admin A–Z Access

An authenticated `SUPER_ADMIN` can access and administer every TourismuBD application domain, including users, providers, listings, Places, route data, bookings, reviews, subscriptions, reports, and operational configuration.

`SUPER_ADMIN` can create, view, edit, approve, reject, publish, hide, suspend, reactivate, restore, remove, and delete records as allowed by database integrity and legal/privacy requirements.

Normal Traveler/Provider RLS ownership restrictions do not block Super Admin administrative operations.

## AC-27 — Destructive Admin Safety

Permanent destructive actions require confirmation and sensitive Super Admin changes are audit logged. Where practical, records support soft delete/restore before permanent deletion.

---

# 62. Open Implementation Decisions

The following remain implementation decisions, not permission to change the product rules above:

1. Exact first 8–12 Sylhet Places.
2. Exact routing/map provider.
3. Exact route cost function.
4. Exact maximum selected Places before route planning becomes too expensive/confusing.
5. Whether district planner begins mainly with curated templates or more dynamic grouping.
6. Exact login point for browsing versus Save/Booking.
7. Exact booking completion confirmation workflow.
8. Exact consent UI when traveler contact is shared after confirmation.
9. Exact NID retention/deletion policy after legal/privacy review.
10. Exact subscription payment channel and manual verification workflow.
11. Exact listing-count limits per provider account.
12. Exact notification delivery system.
13. Exact analytics/event implementation.
14. Whether water-body records are mandatory for all water listings or optional where district/service area is sufficient.

The following are **not open**:

- Tour Guide subscription price = ৳10/month.
- Houseboat Owner subscription price = ৳100/month.
- Small Boat Owner subscription price = ৳50/month.
- Resort / Hotel Owner subscription price = ৳100/month.
- Car / Transport Owner subscription price = ৳50/month.
- Parking Owner subscription price = ৳30/month.
- Tour Agency / Tour Host Organization subscription price = ৳70/month.
- both water options appear on every district page.
- Houseboat is multi-day traveler-selectable nationwide.
- Sundarbans Small Boat is exactly one day.
- non-Sundarbans Small Boat duration is traveler-selectable.
- provider contact unlocks after confirmed booking.
- founder/owner `SUPER_ADMIN` has full A–Z administrative authority across the application.
- normal Traveler/Provider ownership restrictions must not block authorized `SUPER_ADMIN` operations.
- sensitive/destructive Super Admin operations require confirmation/audit protection without removing Super Admin authority.

---

# 63. Final Product Principles

## Principle 1 — Core Journey First

> **Place discovery and practical routing must remain useful even without a provider booking.**

## Principle 2 — Same Water Vocabulary Nationwide

> **Every district offers Find a Houseboat and Rent a Small Boat. Availability changes; the UI vocabulary does not.**

## Principle 3 — Honest Supply

> **Never fake providers or hide an empty market. Show an honest empty state.**

## Principle 4 — Simple Marketplace

> **Request → Accept/Decline → Confirmed → Contact → Completed → Review.**

## Principle 5 — Precise Trust

> **Say only what TourismuBD has actually verified.**

## Principle 6 — Human Before Automation

> **If a tiny team can safely handle it manually, automation can wait.**

## Principle 7 — Location-Aware Rules Without UI Fragmentation

> **The same water interface appears nationwide, while service rules such as the Sundarbans one-day Small Boat rule are enforced underneath.**

## Principle 8 — Protect Confirmed Travelers

> **A provider subscription problem must not automatically destroy an already Confirmed traveler booking.**

---

# 64. Final Build Brief

> **Build TourismuBD as a Place-first Bangladesh travel planner: travelers discover Places, find nearby destinations, create practical routes, save trips, and optionally book Identity Verified Guides or water providers through a simple Booking Marketplace Lite flow. Every district page shows the same Explore by Water options — Find a Houseboat and Rent a Small Boat — with honest empty states when supply is unavailable. Houseboats are bookable for traveler-selected multi-day durations everywhere in Bangladesh with no district exception. Small Boats are traveler-selectable for one or multiple days everywhere except the Sundarbans, where Small Boat duration is fixed to one day. Monthly provider subscriptions are fixed at Guide ৳10, Houseboat ৳100, Small Boat ৳50, Resort/Hotel ৳100, Car/Transport ৳50, Parking ৳30, and Tour Agency/Tour Host Organization ৳70. Later-phase marketplaces remain defined parts of TourismuBD, and their fixed fee becomes applicable when that marketplace/account type is activated rather than making every marketplace an initial-launch blocker. Provider contact unlocks only after confirmation, reviews require completed TourismuBD bookings, and the product remains simple enough for a tiny Admin team to operate.**

---

# 65. Final One-Sentence Product Statement

> **TourismuBD helps travelers discover Bangladesh, organize practical routes, and connect with trusted local travel services — beginning with Guides, Houseboats, and Small Boats while retaining Resort/Hotel, Car/Transport, Parking, and Tour Agency marketplaces as deliberate later expansions — without turning the first product into an oversized travel super-app.**
