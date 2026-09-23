const fs = require('fs');
const path = require('path');

const rawData = `
KELUARGA ANAM

6. Mas yuli & istri
17. Mas tio
18. Bella
19. Eka
20. Pandji
21. Tuti & suami
22. Camelia & suami
23. Mas supri
24. pade budi
25. Mas dedi
27. Affriyanto

📝KEL. ALM MAMA
1. Pakde iwan & budeh umi
2. Thalla & suami
3. Della
4. Mas riski
5. lik kho & suami
6. Ilyas

📝KEL. MBA AYU
1. Mba ayu & Mas Ian
2. Ka Debi dan dira
3.  Athar
4.  
5.  
6.  
7.  
8.  

📝KEL MBA DIAH
1. Mba diah & Mas Angga
2. Mama mas Angga
3. Mas Seno
4. Mba Sari

📝ANAM
1. Adel
2. Ayup
3. arya & ferdi
4. ghani
5. abieza
6. redap
7. acil
8. azis
9. bagas
10. dani
11. diaz
12. ferdi
13. acong
14. Khoirul fadillah
15. kincu
16. Agil
17. ryansyah
18. Fajriyan
19. Rafi 
20. Labib
21. Arif (ijat)
22. Faiz
23. Ridho bang do
24. Rosal
25. Andre
26. Aprizul
27. Ateng
28. Akmal
29. Ditto
30. Farizqi
31. Jeddy
32. Khoirul Anwar
33. Narendra
34. Nicolas
35. Pandu
36. Yang Mulia Rapi
37. Rifki
38. Bang Le
39. Rombeng 
40. Fikri & istri
41. Setiaji
42. Septyan
43. Afif
44. Arif
45. Naumi
46. Noval
47. Arsha
48. Adi
49. Adly
50. Brian
51. Azhril
52. Erlang
53. Ibrahim
54. Razka
55. Ridho
56. Damar deisya
57. Akbar warkop
58. Syafiq
59. Wisnu
60. Yogi
61. Zafuan Malaysia
62. dhafa
63. Arif hidayat
64. ilham
65. Ajil Jakrta
66. Fikri lele
67. Farid
68. Firman
69. Fariz
70. Alief 
71. Dimaz
72. Dhimas mekanik feeling
73. Rival mekanik feeling 
74. Bang aul
75. Sultan 
76. unad
77. Mas aris AGIT
78. Agung
79. Fathan
80. Carlos
81. Wahyu Bandot 
82. Adam
83. Ardinta
84. Anom
85. Yosep
86. Ustad Ryan
87. Pancer
88. Alpan
89. Zaidan
90. nabil
91. Adit jon
92. Ikmal
93. Bapak Adel & ibu adel
94. Fauzan armansyah
95. Pa ridho
96. Aziz Konsultan
97. Dzabian
98. Aldo
99. Bunda Ghani 
99. Baong & istri
100. Arya dan istri
101. Monyong & Aristo
102. Bima & Rama
103. saril & syifa
104. aini
105. pa cahyadi & istri
106. Bapak Arya & Ibu Arya
107. Bang keong

📝ilham
1. gathan
2. rudi
3. Ardi
4. Bayu

📝ANGI
1. Arida (0896-8277-6817)
2. Syahdana (0838-7943-2450)
3. Fitri (0838-0719-0551)
4. Sabrina (0877-5910-5500)
5. Makaveli Ariel (0813-8398-3450)
6. Akbar (0851-0482-1461)
7. Hikmah (DM ig)
8. Maulida & Febrian (0895-3448-97623)
9.  Fani (0819-0841-4872)
10.  Donie (0878-6558-3921)
11.  Yanti (0895-0450-2451)
12. Tiara (0895-3514-71178)
13.  Regina (0856-9130-5792)
14.  Rival (0877-8447-0373)
15. Siti Khodijah (DM ig)
16. Gaby (0895-8113-14567)
17. Aris (0896-0414-2350)
18. Maulana (0895-3384-98749)
19. Nitis Aulia (0878-7257-5192)
20. Icha (0814-1020-1906)
21. Adinda (0857-9388-5685)
22. Firnanda (0896-9923-2901)
23. Bening (DM ig)
24. Ananda (DM ig)
25. Betha (0895-3330-94337)
26. Nurul (DM ig)
27. Emha (DM ig)
28. Anita Dj (DM ig)
29. Arif Acay (0896-1746-643)
30. Shifa (DM ig)
31. Akfa (0838-9827-8276)
32. Fatih (0896-6232-6455)
33. Eka (0881-5656-613)
34. Nuke (DM ig)
35. Diana (0858-9015-4356)
36. Dhea (DM ig)
37. Fernando (0896-1501-0503)
38. Nabilah (DM ig)
39. Maharani (Ara) (DM ig)
40. Ani (0858-9015-4356)
41. Rosa (0896-6231-5324)
42. Ibunya Asha (nyusul)
43. Faisal Kejod (0895-3517-15322)
44. Sindi (0895-4068-96271)
45. Nabilla (DM ig)
`;

function formatPhoneNumber(num) {
  if (!num) return undefined;
  let cleaned = num.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  }
  return cleaned.length >= 8 ? cleaned : undefined;
}

const lines = rawData.split("\n");
let currentCategory = "Keluarga Anam";
const guests = [];
let idCounter = 1000;

for (let line of lines) {
  let trimmed = line.trim();
  if (!trimmed) continue;

  // Only check section headers on lines that do NOT start with a number
  if (!/^\d+[\.\)]/.test(trimmed)) {
    if (trimmed.includes("KELUARGA ANAM")) {
      currentCategory = "Keluarga Anam";
      continue;
    }
    if (trimmed.includes("KEL. ALM MAMA")) {
      currentCategory = "Kel. Alm Mama";
      continue;
    }
    if (trimmed.includes("KEL. MBA AYU")) {
      currentCategory = "Kel. Mba Ayu";
      continue;
    }
    if (trimmed.includes("KEL MBA DIAH")) {
      currentCategory = "Kel. Mba Diah";
      continue;
    }
    if (trimmed.includes("ANAM")) {
      currentCategory = "Teman Anam";
      continue;
    }
    if (trimmed.includes("ilham") || trimmed.includes("ILHAM")) {
      currentCategory = "Teman Ilham";
      continue;
    }
    if (trimmed.includes("ANGI")) {
      currentCategory = "Teman Angi";
      continue;
    }
  }

  // Remove leading numbers: "1. ", "24. ", etc.
  let content = trimmed.replace(/^\d+[\.\)]\s*/, "").trim();
  if (!content) continue;

  // Extract phone number in parentheses if present
  let phone = undefined;
  let name = content;

  // Match (08...)
  const phoneMatch = content.match(/\((08[\d\-]+)\)/);
  if (phoneMatch) {
    phone = formatPhoneNumber(phoneMatch[1]);
    name = content.replace(phoneMatch[0], "").trim();
  }

  // Strip notes like (DM ig), (nyusul)
  name = name.replace(/\(DM\s*ig\)/i, "").replace(/\(nyusul\)/i, "").trim();

  // Capitalize name properly if all lowercase
  // But leave natural casing if already mixed
  if (name === name.toLowerCase()) {
    name = name.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  idCounter++;
  guests.push({
    id: `guest-${idCounter}`,
    code: name,
    name: name,
    phone: phone,
    category: currentCategory,
    template: "Standar",
    status: "pending",
    checkedIn: false,
    pax: name.includes("&") || name.includes("dan") || name.includes("suami") || name.includes("istri") ? 2 : 1,
    createdAt: new Date().toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  });
}

console.log(`Parsed ${guests.length} guests.`);
fs.writeFileSync(path.join(__dirname, '../src/data/initialGuests.json'), JSON.stringify(guests, null, 2));
