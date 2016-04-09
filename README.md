# Taggable Master Hotel ID Mapping Script

Each Local market has their own Hotel Code/ID, in the case of the Nordics
the its the `WVitemID`. The *Taggable* system uses the "*Master*" Hotel ID (`MHID`).

We need to map the `WVitemID` to `MHID` so we are able to perform lookups in
*Taggable* given a `WVitemID`.

This script takes a `.csv` file and transforms it into a `.JSON`
that we can use to insert the records into the Taggable System.



## How?

> ***WARNING***: ***Do Not*** attempt to **Open** `/data/all_ne_hotels.json` 
in your **Text Editor**, ***it will crash***!!
if you want to view it for any reason, use [glogg](http://glogg.bonnefon.org)

### *Extract*

*Extract* the Data from Spreadsheet as `.csv`

Steps taken to use the data in the spreadsheet.

#### 1. Open the email from Jesper containing the *IS - Hotels DA v1.xlsx* spreadsheet attachment.

![00-email-from-jesper-containing-data](https://cloud.githubusercontent.com/assets/194400/14103973/7e3aeeb8-f59a-11e5-8edb-715f94b40e2e.png)

#### 2. Locate the Attachment Icon and Click on "***Edit in Google Sheets***" button.

#### 3. Download as *Comma-separated values* (.csv)

![03-download-as-csv](https://cloud.githubusercontent.com/assets/194400/14104018/d0f86266-f59a-11e5-887d-cb9318dbd917.png)


Sample `.CSV` data:

```csv
HotelName,MHID,WVitemID,NE_Code,CAitemID,TripadvisorLocationID
1800 Apartments,htkcusn,4463,PVKARTO      ,16084,0
51 Buckingham Gate,nexgah5,139373,HLONBUGA,61344,0
987 Barcelona,qpzq1bp,138269,HBCN987B,58835,646310
Aana Resort and Spa,7exzhjg,108176,HTDXAANA,4728,582064
Abella,pyypism,4473,CHQABEL      ,61372,3291424
Abrial,ttbL91i,138821,HNCEKYRI,59278,196988
AC Gran Canaria,wf7ec89,139866,LPAACGR,61611,249109
AC Hotel Alicante By Marriott,fxfbbs5,183824,HALCACAL,75198,0
AC Hotel Ambassadeur Antibes-Juan les Pins,,138649,HNCEAMBA,75298,229690
Accademia,e74szm0,11111,HROMACCA,9315,203153
Achilleas,y3gpuvv,4488,PVKACCH      ,16085,581935
Achilles Plaza,,14537,CHQACPL,71557,658786
```
As you can see, there are rows without `MHID` in the dataset.
In fact there are *many* such "Blanks" in the data.
Jesper is in the process of fixing this.


#### 4. Use the CSV File

Once you have the `.csv` file you can run the script.

> Note the script expects the file name to be: `IS-Hotels-DA-v1.csv`
either change your `.csv` file name or update the script.

The script will output a JSON file which you can use in the next step.

Sample JSON output:
```js
{
  "4463": {
    "HotelName": "1800 Apartments",
    "MHID": "htkcusn",
    "WVitemID": "4463",
    "NE_Code": "PVKARTO",
    "CAitemID": "16084",
    "TripadvisorLocationID": "0"
  },
  "4473": {
    "HotelName": "Abella",
    "MHID": "pyypism",
    "WVitemID": "4473",
    "NE_Code": "CHQABEL",
    "CAitemID": "61372",
    "TripadvisorLocationID": "3291424"
  }
}
```
This JSON object/map allows you to lookup an NE Hotel by its `WVitemID`.


### Part 2 - Master Hotel Records

Mapping the `CSV` from the Master Hotel CMS


> Data source: http://masterdata.prod.int/hotel-search (*TC internal network & LDAP Access required*)
> Sample: [`date-20160323-time-105609-42042-hotels.csv`](https://github.com/numo-labs/taggable-master-hotel-mapping-script/blob/master/date-20160323-time-105609-42042-hotels.csv)

Sample:

```csv
MID;Name;Country;ISO-2;Address;Latitude;Longitude
022wje3;Europa;Italy;IT;"Viale Kennedy 3
34073 Grado";"45,67960";"13,40070"
024oua5;Hiberia;Italy;IT;"Via XXIV Maggio 8
00187 Rome";"41,89720";"12,48680"
028gupn;Regal Riverside;Hong Kong;HK;"34-36 Tai Chung Kiu Road
Shatin
Hong Kong";"22,38260";"114,19600"
02j7qry;Okaliptus Holiday Villas Apart;Turkey;TR;"Sevket Sabanci Caddesi No. 70
Bahçelievler Mevkii
Turgutreis";"37,02130";"27,25120"
02pc99z;California Apartementos;Spain;ES;"Prat d'en Carbó
43840 Salou";"41,07620";"1,14667"
02tu1jz;Elvis Presley's Heartbreak;United States;US;"3677 Elvis Presley Blvd.
Memphis
Tennessee 38116";"35,04850";"-90,02710"
```

As you can see, the data exported from the CMS includes newline characters.
I could not figure out the RegEx to parse it so I asked the internet:
http://stackoverflow.com/questions/36288375/how-to-parse-csv-data-that-contains-newlines-in-field-using-javascript

Parsed result JSON:
 [mhid-data.json](https://github.com/numo-labs/taggable-master-hotel-mapping-script/blob/master/mhid-data.json)
```js
{
  "022wje3": {
    "MID": "022wje3",
    "Name": "Europa",
    "Country": "Italy",
    "ISO-2": "IT",
    "Address": "Viale Kennedy 3\r\n34073 Grado",
    "Latitude": "45,67960",
    "Longitude": "13,40070"
  },
  "02tu1jz": {
    "MID": "02tu1jz",
    "Name": "Elvis Presley's Heartbreak",
    "Country": "United States",
    "ISO-2": "US",
    "Address": "3677 Elvis Presley Blvd.\r\nMemphis\r\nTennessee 38116",
    "Latitude": "35,04850",
    "Longitude": "-90,02710"
  }
}
```
This data model allows us to lookup all a Master Hotel Record by its `MID`.

