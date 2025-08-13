export function findBankByName(
  search: string
): (typeof banks)[number] | undefined {
  search = search.toLowerCase();
  return banks.find((bank) => {
    let name = bank.name.toLowerCase();
    if (name === search) return true;

    name = name
      .replace("bank", "")
      .replace("mfb", "")
      .replace("microfinance", "")
      .trim();

    search = search
      .replace("bank", "")
      .replace("mfb", "")
      .replace("microfinance", "")
      .trim();

    if (name === search) return true;

    if (name.includes(search)) return true;
    if (name.includes(search.split(" ")[0])) return true;

    return false;
  });
}

const banks = [
  {
    code: "120001",
    name: "9mobile 9Payment Service Bank",
    country: "Nigeria",
  },
  {
    code: "404",
    name: "Abbey Mortgage Bank",
    country: "Nigeria",
  },
  {
    code: "51204",
    name: "Above Only MFB",
    country: "Nigeria",
  },
  {
    code: "51312",
    name: "Abulesoro MFB",
    country: "Nigeria",
  },
  {
    code: "044",
    name: "Access Bank",
    country: "Nigeria",
  },
  {
    code: "063",
    name: "Access Bank (Diamond)",
    country: "Nigeria",
  },
  {
    code: "602",
    name: "Accion Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "50315",
    name: "Aella MFB",
    country: "Nigeria",
  },
  {
    code: "90077",
    name: "AG Mortgage Bank",
    country: "Nigeria",
  },
  {
    code: "50036",
    name: "Ahmadu Bello University Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "120004",
    name: "Airtel Smartcash PSB",
    country: "Nigeria",
  },
  {
    code: "51336",
    name: "AKU Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "090561",
    name: "Akuchukwu Microfinance Bank Limited",
    country: "Nigeria",
  },
  {
    code: "035A",
    name: "ALAT by WEMA",
    country: "Nigeria",
  },
  {
    code: "090629",
    name: "Amegy Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "50926",
    name: "Amju Unique MFB",
    country: "Nigeria",
  },
  {
    code: "51341",
    name: "AMPERSAND MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "645",
    name: "Amucha MFB",
    country: "Nigeria",
  },
  {
    code: "645",
    name: "Amucha Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "50083",
    name: "Aramoko MFB",
    country: "Nigeria",
  },
  {
    code: "401",
    name: "ASO Savings and Loans",
    country: "Nigeria",
  },
  {
    code: "50092",
    name: "Assets Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "MFB50094",
    name: "Astrapolaris MFB LTD",
    country: "Nigeria",
  },
  {
    code: "090478",
    name: "AVUENEGBE MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "51351",
    name: "AWACASH MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "51337",
    name: "AZTEC MICROFINANCE BANK LIMITED",
    country: "Nigeria",
  },
  {
    code: "51229",
    name: "Bainescredit MFB",
    country: "Nigeria",
  },
  {
    code: "50117",
    name: "Banc Corp Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "MFB50992",
    name: "Baobab Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "51100",
    name: "BellBank Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "51267",
    name: "Benysta Microfinance Bank Limited",
    country: "Nigeria",
  },
  {
    code: "50123",
    name: "Beststar Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "50931",
    name: "Bowen Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "FC40163",
    name: "Branch International Financial Services Limited",
    country: "Nigeria",
  },
  {
    code: "565",
    name: "Carbon",
    country: "Nigeria",
  },
  {
    code: "51353",
    name: "Cashbridge Microfinance Bank Limited",
    country: "Nigeria",
  },
  {
    code: "865",
    name: "CASHCONNECT MFB",
    country: "Nigeria",
  },
  {
    code: "50823",
    name: "CEMCS Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "50171",
    name: "Chanelle Microfinance Bank Limited",
    country: "Nigeria",
  },
  {
    code: "312",
    name: "Chikum Microfinance bank",
    country: "Nigeria",
  },
  {
    code: "023",
    name: "Citibank Nigeria",
    country: "Nigeria",
  },
  {
    code: "070027",
    name: "CITYCODE MORTAGE BANK",
    country: "Nigeria",
  },
  {
    code: "50910",
    name: "Consumer Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "50204",
    name: "Corestep MFB",
    country: "Nigeria",
  },
  {
    code: "559",
    name: "Coronation Merchant Bank",
    country: "Nigeria",
  },
  {
    code: "FC40128",
    name: "County Finance Limited",
    country: "Nigeria",
  },
  {
    code: "51297",
    name: "Crescent MFB",
    country: "Nigeria",
  },
  {
    code: "090560",
    name: "Crust Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "51334",
    name: "Davenport MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "50162",
    name: "Dot Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "050",
    name: "Ecobank Nigeria",
    country: "Nigeria",
  },
  {
    code: "50263",
    name: "Ekimogun MFB",
    country: "Nigeria",
  },
  {
    code: "098",
    name: "Ekondo Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "090678",
    name: "EXCEL FINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "50126",
    name: "Eyowo",
    country: "Nigeria",
  },
  {
    code: "51318",
    name: "Fairmoney Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "50298",
    name: "Fedeth MFB",
    country: "Nigeria",
  },
  {
    code: "070",
    name: "Fidelity Bank",
    country: "Nigeria",
  },
  {
    code: "51314",
    name: "Firmus MFB",
    country: "Nigeria",
  },
  {
    code: "011",
    name: "First Bank of Nigeria",
    country: "Nigeria",
  },
  {
    code: "214",
    name: "First City Monument Bank",
    country: "Nigeria",
  },
  {
    code: "090164",
    name: "FIRST ROYAL MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "413",
    name: "FirstTrust Mortgage Bank Nigeria",
    country: "Nigeria",
  },
  {
    code: "501",
    name: "FSDH Merchant Bank Limited",
    country: "Nigeria",
  },
  {
    code: "832",
    name: "FUTMINNA MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "MFB51093",
    name: "Garun Mallam MFB",
    country: "Nigeria",
  },
  {
    code: "812",
    name: "Gateway Mortgage Bank LTD",
    country: "Nigeria",
  },
  {
    code: "00103",
    name: "Globus Bank",
    country: "Nigeria",
  },
  {
    code: "090574",
    name: "Goldman MFB",
    country: "Nigeria",
  },
  {
    code: "100022",
    name: "GoMoney",
    country: "Nigeria",
  },
  {
    code: "090664",
    name: "GOOD SHEPHERD MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "50739",
    name: "Goodnews Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "562",
    name: "Greenwich Merchant Bank",
    country: "Nigeria",
  },
  {
    code: "51276",
    name: "GROOMING MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "058",
    name: "Guaranty Trust Bank",
    country: "Nigeria",
  },
  {
    code: "51251",
    name: "Hackman Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "50383",
    name: "Hasal Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "120002",
    name: "HopePSB",
    country: "Nigeria",
  },
  {
    code: "51211",
    name: "IBANK Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "51244",
    name: "Ibile Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "50439",
    name: "Ikoyi Osun MFB",
    country: "Nigeria",
  },
  {
    code: "50442",
    name: "Ilaro Poly Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "50453",
    name: "Imowo MFB",
    country: "Nigeria",
  },
  {
    code: "415",
    name: "IMPERIAL HOMES MORTAGE BANK",
    country: "Nigeria",
  },
  {
    code: "50457",
    name: "Infinity MFB",
    country: "Nigeria",
  },
  {
    code: "090701",
    name: "ISUA MFB",
    country: "Nigeria",
  },
  {
    code: "301",
    name: "Jaiz Bank",
    country: "Nigeria",
  },
  {
    code: "50502",
    name: "Kadpoly MFB",
    country: "Nigeria",
  },
  {
    code: "51308",
    name: "KANOPOLY MFB",
    country: "Nigeria",
  },
  {
    code: "082",
    name: "Keystone Bank",
    country: "Nigeria",
  },
  {
    code: "100025",
    name: "KONGAPAY (Kongapay Technologies Limited)(formerly Zinternet)",
    country: "Nigeria",
  },
  {
    code: "50200",
    name: "Kredi Money MFB LTD",
    country: "Nigeria",
  },
  {
    code: "50211",
    name: "Kuda Bank",
    country: "Nigeria",
  },
  {
    code: "90052",
    name: "Lagos Building Investment Company Plc.",
    country: "Nigeria",
  },
  {
    code: "50549",
    name: "Links MFB",
    country: "Nigeria",
  },
  {
    code: "031",
    name: "Living Trust Mortgage Bank",
    country: "Nigeria",
  },
  {
    code: "50491",
    name: "LOMA MFB",
    country: "Nigeria",
  },
  {
    code: "303",
    name: "Lotus Bank",
    country: "Nigeria",
  },
  {
    code: "090171",
    name: "MAINSTREET MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "50563",
    name: "Mayfair MFB",
    country: "Nigeria",
  },
  {
    code: "50304",
    name: "Mint MFB",
    country: "Nigeria",
  },
  {
    code: "946",
    name: "Money Master PSB",
    country: "Nigeria",
  },
  {
    code: "50515",
    name: "Moniepoint MFB",
    country: "Nigeria",
  },
  {
    code: "120003",
    name: "MTN Momo PSB",
    country: "Nigeria",
  },
  {
    code: "090190",
    name: "MUTUAL BENEFITS MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "090679",
    name: "NDCC MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "51361",
    name: "NET MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "51142",
    name: "Nigerian Navy Microfinance Bank Limited",
    country: "Nigeria",
  },
  {
    code: "561",
    name: "NOVA BANK",
    country: "Nigeria",
  },
  {
    code: "50629",
    name: "NPF MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "999992",
    name: "OPay Digital Services Limited (OPay)",
    country: "Nigeria",
  },
  {
    code: "107",
    name: "Optimus Bank Limited",
    country: "Nigeria",
  },
  {
    code: "100002",
    name: "Paga",
    country: "Nigeria",
  },
  {
    code: "999991",
    name: "PalmPay",
    country: "Nigeria",
  },
  {
    code: "104",
    name: "Parallex Bank",
    country: "Nigeria",
  },
  {
    code: "311",
    name: "Parkway - ReadyCash",
    country: "Nigeria",
  },
  {
    code: "090680",
    name: "PATHFINDER MICROFINANCE BANK LIMITED",
    country: "Nigeria",
  },
  {
    code: "100039",
    name: "Paystack-Titan",
    country: "Nigeria",
  },
  {
    code: "50743",
    name: "Peace Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "51226",
    name: "PECANTRUST MICROFINANCE BANK LIMITED",
    country: "Nigeria",
  },
  {
    code: "51146",
    name: "Personal Trust MFB",
    country: "Nigeria",
  },
  {
    code: "50746",
    name: "Petra Mircofinance Bank Plc",
    country: "Nigeria",
  },
  {
    code: "050021",
    name: "PFI FINANCE COMPANY LIMITED",
    country: "Nigeria",
  },
  {
    code: "268",
    name: "Platinum Mortgage Bank",
    country: "Nigeria",
  },
  {
    code: "00716",
    name: "Pocket App",
    country: "Nigeria",
  },
  {
    code: "076",
    name: "Polaris Bank",
    country: "Nigeria",
  },
  {
    code: "50864",
    name: "Polyunwana MFB",
    country: "Nigeria",
  },
  {
    code: "105",
    name: "PremiumTrust Bank",
    country: "Nigeria",
  },
  {
    code: "50739",
    name: "Prospa Capital Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "050023",
    name: "PROSPERIS FINANCE LIMITED",
    country: "Nigeria",
  },
  {
    code: "101",
    name: "Providus Bank",
    country: "Nigeria",
  },
  {
    code: "51293",
    name: "QuickFund MFB",
    country: "Nigeria",
  },
  {
    code: "502",
    name: "Rand Merchant Bank",
    country: "Nigeria",
  },
  {
    code: "090496",
    name: "RANDALPHA MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "90067",
    name: "Refuge Mortgage Bank",
    country: "Nigeria",
  },
  {
    code: "50761",
    name: "REHOBOTH MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "50994",
    name: "Rephidim Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "51286",
    name: "Rigo Microfinance Bank Limited",
    country: "Nigeria",
  },
  {
    code: "50767",
    name: "ROCKSHIELD MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "125",
    name: "Rubies MFB",
    country: "Nigeria",
  },
  {
    code: "51113",
    name: "Safe Haven MFB",
    country: "Nigeria",
  },
  {
    code: "951113",
    name: "Safe Haven Microfinance Bank Limited",
    country: "Nigeria",
  },
  {
    code: "40165",
    name: "SAGE GREY FINANCE LIMITED",
    country: "Nigeria",
  },
  {
    code: "50582",
    name: "Shield MFB",
    country: "Nigeria",
  },
  {
    code: "106",
    name: "Signature Bank Ltd",
    country: "Nigeria",
  },
  {
    code: "51062",
    name: "Solid Allianze MFB",
    country: "Nigeria",
  },
  {
    code: "50800",
    name: "Solid Rock MFB",
    country: "Nigeria",
  },
  {
    code: "51310",
    name: "Sparkle Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "221",
    name: "Stanbic IBTC Bank",
    country: "Nigeria",
  },
  {
    code: "068",
    name: "Standard Chartered Bank",
    country: "Nigeria",
  },
  {
    code: "090162",
    name: "STANFORD MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "50809",
    name: "STATESIDE MICROFINANCE BANK",
    country: "Nigeria",
  },
  {
    code: "51253",
    name: "Stellas MFB",
    country: "Nigeria",
  },
  {
    code: "232",
    name: "Sterling Bank",
    country: "Nigeria",
  },
  {
    code: "100",
    name: "Suntrust Bank",
    country: "Nigeria",
  },
  {
    code: "50968",
    name: "Supreme MFB",
    country: "Nigeria",
  },
  {
    code: "302",
    name: "TAJ Bank",
    country: "Nigeria",
  },
  {
    code: "51269",
    name: "Tangerine Money",
    country: "Nigeria",
  },
  {
    code: "000304",
    name: "The Alternative bank",
    country: "Nigeria",
  },
  {
    code: "102",
    name: "Titan Bank",
    country: "Nigeria",
  },
  {
    code: "090708",
    name: "TransPay MFB",
    country: "Nigeria",
  },
  {
    code: "50840",
    name: "U&C Microfinance Bank Ltd (U AND C MFB)",
    country: "Nigeria",
  },
  {
    code: "090706",
    name: "UCEE MFB",
    country: "Nigeria",
  },
  {
    code: "51322",
    name: "Uhuru MFB",
    country: "Nigeria",
  },
  {
    code: "50870",
    name: "Unaab Microfinance Bank Limited",
    country: "Nigeria",
  },
  {
    code: "50871",
    name: "Unical MFB",
    country: "Nigeria",
  },
  {
    code: "51316",
    name: "Unilag Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "032",
    name: "Union Bank of Nigeria",
    country: "Nigeria",
  },
  {
    code: "033",
    name: "United Bank For Africa",
    country: "Nigeria",
  },
  {
    code: "215",
    name: "Unity Bank",
    country: "Nigeria",
  },
  {
    code: "50894",
    name: "Uzondu Microfinance Bank Awka Anambra State",
    country: "Nigeria",
  },
  {
    code: "050020",
    name: "Vale Finance Limited",
    country: "Nigeria",
  },
  {
    code: "566",
    name: "VFD Microfinance Bank Limited",
    country: "Nigeria",
  },
  {
    code: "51355",
    name: "Waya Microfinance Bank",
    country: "Nigeria",
  },
  {
    code: "035",
    name: "Wema Bank",
    country: "Nigeria",
  },
  {
    code: "594",
    name: "Yes MFB",
    country: "Nigeria",
  },
  {
    code: "057",
    name: "Zenith Bank",
    country: "Nigeria",
  },
];