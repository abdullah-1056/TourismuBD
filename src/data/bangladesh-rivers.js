// Bangladesh Major River Vectors & Waterways Data for Interactive Travel Map
// Standardized to the 1560 x 2150 viewBox of BANGLADESH_MAP_VIEWBOX
// Faithfully modeled from the official physical & hydrographic map of Bangladesh

/**
 * Under-layer rivers & water bodies:
 * Rendered underneath the district paths.
 * Because districts are drawn on top, any overlap with land is masked,
 * and the light blue (#38bdf8) perfectly and seamlessly fills the coastal delta,
 * the Bay of Bengal, Kaptai Lake, and natural riverbed channels between districts.
 */
export const BANGLADESH_UNDER_RIVERS = [
  {
    id: "bay-of-bengal-basin",
    name: "Bay of Bengal & Coastal Delta",
    bengali: "বঙ্গোপসাগর ও উপকূলীয় ব-দ্বীপ",
    isPolygon: true,
    // Solid marine ocean body and delta estuary spanning the southern waters of Bangladesh
    path: "M 0 1780 C 120 1770, 220 1760, 320 1750 C 360 1740, 410 1735, 460 1730 C 500 1725, 550 1715, 595 1695 C 630 1690, 680 1690, 730 1690 C 770 1685, 810 1675, 840 1650 C 870 1640, 910 1620, 940 1590 C 950 1500, 920 1350, 890 1260 C 860 1200, 845 1180, 835 1175 C 860 1180, 890 1210, 930 1230 C 970 1240, 1020 1210, 1060 1200 C 1090 1220, 1120 1250, 1150 1280 C 1180 1330, 1220 1400, 1245 1470 C 1255 1530, 1260 1600, 1265 1660 C 1275 1720, 1300 1800, 1330 1880 C 1360 1960, 1390 2040, 1435 2140 L 1560 2150 L 0 2150 Z",
    fill: "#38bdf8",
    color: "#38bdf8",
  },
  {
    id: "kaptai-lake",
    name: "Kaptai Lake",
    bengali: "কাপ্তাই হ্রদ",
    isPolygon: true,
    // Largest water reservoir in Bangladesh located in Rangamati (Chittagong Hill Tracts)
    path: "M 1365 1350 C 1375 1330, 1390 1320, 1410 1335 C 1425 1345, 1420 1365, 1405 1380 C 1420 1390, 1435 1410, 1430 1430 C 1425 1445, 1405 1445, 1390 1430 C 1380 1420, 1370 1425, 1360 1435 C 1350 1445, 1340 1435, 1345 1415 C 1350 1395, 1360 1385, 1355 1370 C 1350 1360, 1355 1355, 1365 1350 Z",
    fill: "#38bdf8",
    color: "#38bdf8",
  },
  {
    id: "padma-upper-gap",
    name: "Padma River (Upper Ganges)",
    bengali: "পদ্মা নদী (উজান)",
    // From western Rajshahi border near Godagari (145, 815) to Goalundo confluence (567, 994)
    path: "M 145 815 C 190 845, 230 875, 270 890 C 315 910, 355 935, 400 950 C 450 970, 500 995, 567 994",
    width: 36,
    color: "#38bdf8",
  },
  {
    id: "padma-lower-gap",
    name: "Padma River (Lower)",
    bengali: "পদ্মা নদী (ভাটি)",
    // From Goalundo confluence (567, 994) to Chandpur Mohona (835, 1175)
    path: "M 567 994 C 596 1038, 647 1069, 679 1083 C 710 1101, 743 1139, 775 1145 C 800 1155, 820 1170, 835 1175",
    width: 44,
    color: "#38bdf8",
  },
  {
    id: "tetulia-gap",
    name: "Tetulia River Channel",
    bengali: "তেঁতুলিয়া নদী চ্যানেল",
    isPolygon: true,
    // Natural water channel separating Bhola island from Barishal and Patuakhali mainland
    path: "M 835 1300 C 810 1350, 780 1410, 765 1470 C 750 1530, 755 1590, 750 1650 L 745 1730 L 870 1730 C 875 1660, 885 1590, 895 1530 C 905 1470, 900 1410, 885 1350 C 870 1310, 850 1300, 835 1300 Z",
    fill: "#38bdf8",
    color: "#38bdf8",
  },
  {
    id: "meghna-estuary-gap",
    name: "Lower Meghna Estuary & Shahbazpur Channel",
    bengali: "মেঘনা মোহনা ও শাহবাজপুর চ্যানেল",
    isPolygon: true,
    // Wide estuary east of Bhola, flowing around Manpura Island and connecting Lower Meghna to the sea
    path: "M 860 1230 C 910 1250, 960 1280, 1010 1320 C 1050 1360, 1080 1420, 1090 1500 C 1100 1580, 1080 1660, 1040 1740 L 860 1740 C 860 1680, 880 1620, 905 1560 C 925 1500, 920 1440, 895 1380 C 875 1320, 850 1260, 860 1230 Z",
    fill: "#38bdf8",
    color: "#38bdf8",
  },
  {
    id: "haringhata-estuary-gap",
    name: "Haringhata & Lower Baleshwar Estuary",
    bengali: "হরিণঘাটা ও বলেশ্বর মোহনা",
    isPolygon: true,
    // Water mouth between Bagerhat and Barguna, filling southern Barguna coastal notch and Bay inlet
    path: "M 580 1560 C 590 1600, 595 1650, 600 1690 C 605 1730, 615 1755, 675 1755 C 685 1720, 680 1670, 665 1620 C 655 1580, 600 1550, 580 1560 Z",
    fill: "#38bdf8",
    color: "#38bdf8",
  },
  {
    id: "patuakhali-coastal-channels",
    name: "Rabnabad & Coastal Island Channels",
    bengali: "রাবনাবাদ ও উপকূলীয় দ্বীপ চ্যানেল",
    isPolygon: true,
    // Marine channels between Patuakhali mainland and Kuakata/Rangabali coastal islands
    path: "M 705 1595 C 730 1585, 780 1585, 830 1590 C 880 1595, 895 1630, 885 1680 C 875 1730, 820 1745, 755 1740 C 715 1730, 695 1670, 705 1595 Z",
    fill: "#38bdf8",
    color: "#38bdf8",
  },
  {
    id: "bhola-south-channels",
    name: "South Bhola Marine Channels",
    bengali: "দক্ষিণ ভোলা চ্যানেল",
    isPolygon: true,
    // Channels surrounding Char Kukri-Mukri and Dhal Char south of Bhola island
    path: "M 825 1630 C 850 1620, 890 1620, 925 1630 C 940 1650, 940 1690, 925 1730 L 825 1730 C 815 1690, 815 1650, 825 1630 Z",
    fill: "#38bdf8",
    color: "#38bdf8",
  },
  {
    id: "payra-bishkhali-gap",
    name: "Payra & Bishkhali Rivers",
    bengali: "পায়রা ও বিষখালী নদী",
    // Coastal waterway between Barguna and Patuakhali
    path: "M 725 1460 C 720 1520, 715 1590, 708 1660 L 698 1720",
    width: 24,
    color: "#38bdf8",
  },
  {
    id: "baleshwar-gap",
    name: "Baleshwar River",
    bengali: "বলেশ্বর নদী",
    // Boundary waterway between Bagerhat and Pirojpur/Barguna
    path: "M 632 1365 C 628 1430, 622 1510, 616 1590 L 612 1710",
    width: 24,
    color: "#38bdf8",
  },
  {
    id: "pasur-rupsha-gap",
    name: "Pasur & Rupsha Rivers",
    bengali: "পশুর ও রূপসা নদী",
    // Major Sundarbans mangrove waterway through Khulna and Bagerhat to the sea
    path: "M 480 1370 C 485 1440, 480 1520, 475 1600 L 470 1720",
    width: 22,
    color: "#38bdf8",
  },
  {
    id: "meghna-lower-gap",
    name: "Lower Meghna River Channel",
    bengali: "মেঘনা নদী চ্যানেল",
    // Major channel connecting Chandpur Mohona to the Meghna Estuary and Bay of Bengal
    path: "M 835 1175 C 842 1205, 835 1240, 842 1275 C 855 1315, 875 1345, 905 1375 C 925 1395, 960 1425, 995 1450",
    width: 40,
    color: "#38bdf8",
  },
];

/**
 * Over-layer rivers:
 * Visible river paths rendered with a protective halo and vibrant light blue stroke
 * for major rivers across Bangladesh whose district polygons touch or need explicit tracing.
 */
export const BANGLADESH_OVER_RIVERS = [
  {
    id: "jamuna-river",
    name: "Jamuna River",
    bengali: "যমুনা নদী",
    category: "Major River",
    description: "One of the three great rivers of Bangladesh, flowing south from the Brahmaputra into the Padma.",
    // Exact digitized boundary points between Kurigram/Gaibandha/Bogura/Sirajganj and Jamalpur/Tangail
    path: "M 585,320 C 575,380 565,437 559,446 C 571,487 547,516 531,549 C 533,583 538,627 547,650 C 561,656 571,664 575,711 C 571,729 563,738 559,764 C 549,778 561,804 571,823 C 572,858 582,889 583,908 C 574,925 550,959 562,977 L 567,994",
    width: 9,
    color: "#38bdf8",
  },
  {
    id: "meghna-upper-river",
    name: "Upper Meghna River",
    bengali: "উজান মেঘনা নদী",
    category: "Major River",
    description: "Flowing from the Surma-Kushiyara confluence past Kishoreganj and Brahmanbaria to join the Padma at Chandpur.",
    path: "M 1070,810 C 1010,860 970,940 922,980 C 887,1020 864,1060 835,1140 L 835,1180",
    width: 8,
    color: "#38bdf8",
  },
  {
    id: "meghna-lower-river",
    name: "Lower Meghna River",
    bengali: "মেঘনা নদী (ভাটি)",
    category: "Major River",
    description: "The combined massive flow of Padma and Meghna flowing south from Chandpur Mohona past Lakshmipur and Barishal into the Bay of Bengal.",
    path: "M 835 1175 C 842 1205, 835 1240, 842 1275 C 855 1315, 875 1345, 905 1375 C 925 1395, 960 1425, 995 1450",
    width: 9.5,
    color: "#38bdf8",
  },
  {
    id: "old-brahmaputra-river",
    name: "Old Brahmaputra River",
    bengali: "পুরাতন ব্রহ্মপুত্র নদী",
    category: "Major River",
    description: "The historic main channel of the Brahmaputra, looping southeast from Jamuna across Mymensingh to the Meghna.",
    path: "M 565 545 C 610 570, 665 600, 720 630 C 775 660, 830 700, 885 745 C 930 780, 975 810, 1020 835",
    width: 6,
    color: "#38bdf8",
  },
  {
    id: "gorai-madhumati-river",
    name: "Gorai-Madhumati River",
    bengali: "গড়াই-মধুমতী নদী",
    category: "Major Distributary",
    description: "The primary southern distributary of the Padma, flowing through Kushtia, Magura, and Narail to the delta.",
    path: "M 340 935 C 385 995, 425 1050, 465 1110 C 495 1160, 520 1220, 545 1280 C 565 1320, 590 1360, 615 1410",
    width: 6,
    color: "#38bdf8",
  },
  {
    id: "teesta-river",
    name: "Teesta River",
    bengali: "তিস্তা নদী",
    category: "Major River",
    description: "The main river of northern Bangladesh, flowing through Nilphamari and Rangpur into the Jamuna.",
    path: "M 320 150 C 360 190, 410 240, 460 290 C 500 330, 535 355, 565 375",
    width: 6,
    color: "#38bdf8",
  },
  {
    id: "surma-river",
    name: "Surma River",
    bengali: "সুরমা নদী",
    category: "Major River",
    description: "Major river of the Sylhet basin flowing through Sylhet and Sunamganj to form the Meghna.",
    path: "M 1360 540 C 1280 565, 1200 590, 1140 620 C 1100 645, 1070 680, 1055 725 L 1070 810",
    width: 5.5,
    color: "#38bdf8",
  },
  {
    id: "kushiyara-river",
    name: "Kushiyara River",
    bengali: "কুশিয়ারা নদী",
    category: "Major River",
    description: "Branch of the Barak flowing through Moulvibazar and Habiganj to join the Surma.",
    path: "M 1330 670 C 1260 710, 1190 745, 1130 770 L 1070 810",
    width: 5,
    color: "#38bdf8",
  },
  {
    id: "karnaphuli-river",
    name: "Karnaphuli River",
    bengali: "কর্ণফুলী নদী",
    category: "Major River",
    description: "The primary river of the Chittagong region, flowing from Kaptai Lake into the Bay of Bengal.",
    path: "M 1360 1420 C 1315 1435, 1270 1460, 1235 1485 C 1210 1515, 1190 1525, 1180 1535",
    width: 6.5,
    color: "#38bdf8",
  },
];

/**
 * River text labels with coordinates, angle, and bilingual names
 * to make every major river instantly identifiable.
 */
export const BANGLADESH_RIVER_LABELS = [
  {
    id: "label-jamuna",
    text: "Jamuna River",
    bengali: "যমুনা নদী",
    x: 520,
    y: 770,
    rotate: -82,
    fontSize: 20,
  },
  {
    id: "label-padma-west",
    text: "Padma River",
    bengali: "পদ্মা নদী",
    x: 370,
    y: 925,
    rotate: 18,
    fontSize: 20,
  },
  {
    id: "label-padma-mid",
    text: "Padma River",
    bengali: "পদ্মা নদী",
    x: 670,
    y: 1065,
    rotate: 26,
    fontSize: 20,
  },
  {
    id: "label-old-brahmaputra",
    text: "Old Brahmaputra",
    bengali: "পুরাতন ব্রহ্মপুত্র",
    x: 790,
    y: 690,
    rotate: 32,
    fontSize: 16,
  },
  {
    id: "label-gorai-madhumati",
    text: "Gorai-Madhumati",
    bengali: "গড়াই-মধুমতী",
    x: 440,
    y: 1080,
    rotate: 55,
    fontSize: 16,
  },
  {
    id: "label-teesta",
    text: "Teesta River",
    bengali: "তিস্তা নদী",
    x: 440,
    y: 275,
    rotate: 42,
    fontSize: 16,
  },
  {
    id: "label-meghna-upper",
    text: "Meghna River",
    bengali: "মেঘনা নদী",
    x: 920,
    y: 990,
    rotate: -48,
    fontSize: 20,
  },
  {
    id: "label-meghna-lower",
    text: "Meghna River",
    bengali: "মেঘনা নদী",
    x: 885,
    y: 1300,
    rotate: 58,
    fontSize: 19,
  },
  {
    id: "label-surma",
    text: "Surma River",
    bengali: "সুরমা নদী",
    x: 1220,
    y: 585,
    rotate: -15,
    fontSize: 16,
  },
  {
    id: "label-meghna-estuary",
    text: "Meghna Estuary",
    bengali: "মেঘনা মোহনা",
    x: 940,
    y: 1520,
    rotate: 60,
    fontSize: 21,
  },
  {
    id: "label-sandwip-channel",
    text: "Sandwip Channel",
    bengali: "সন্দ্বীপ চ্যানেল",
    x: 1165,
    y: 1470,
    rotate: 72,
    fontSize: 18,
  },
  {
    id: "label-karnaphuli",
    text: "Karnaphuli River",
    bengali: "কর্ণফুলী নদী",
    x: 1260,
    y: 1475,
    rotate: -25,
    fontSize: 17,
  },
  {
    id: "label-kaptai-lake",
    text: "Kaptai Lake",
    bengali: "কাপ্তাই হ্রদ",
    x: 1400,
    y: 1390,
    rotate: 0,
    fontSize: 15,
  },
  {
    id: "label-tetulia",
    text: "Tetulia River",
    bengali: "তেঁতুলিয়া নদী",
    x: 818,
    y: 1510,
    rotate: 80,
    fontSize: 17,
  },
  {
    id: "label-baleshwar",
    text: "Baleshwar River",
    bengali: "বলেশ্বর নদী",
    x: 606,
    y: 1530,
    rotate: 88,
    fontSize: 16,
  },
  {
    id: "label-bay-of-bengal",
    text: "Bay of Bengal",
    bengali: "বঙ্গোপসাগর",
    x: 820,
    y: 1950,
    rotate: 0,
    fontSize: 28,
  },
];
