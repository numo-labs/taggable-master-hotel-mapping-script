# Taggable Master Hotel ID Mapping Script

Each Local market has their own Hotel Code/ID, in the case of the Nordics
the its the `WVitemID`. The *Taggable* system uses the "*Master*" Hotel ID (`MHID`).

We need to map the `WVitemID` to `MHID` so we are able to perform lookups in
*Taggable* given a `WVitemID`.

This script takes a `.csv` file and transforms it into a `.JSON`
that we can use to insert the records into the Taggable System.



## How?

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
[
  {
    "HotelName": "987 Barcelona",
    "MHID": "qpzq1bp",
    "WVitemID": "138269",
    "NE_Code": "HBCN987B",
    "CAitemID": "58835",
    "TripadvisorLocationID": "646310"
  },
  {
    "HotelName": "Aana Resort and Spa",
    "MHID": "7exzhjg",
    "WVitemID": "108176",
    "NE_Code": "HTDXAANA",
    "CAitemID": "4728",
    "TripadvisorLocationID": "582064"
  },
  {
    "HotelName": "Abella",
    "MHID": "pyypism",
    "WVitemID": "4473",
    "NE_Code": "CHQABEL",
    "CAitemID": "61372",
    "TripadvisorLocationID": "3291424"
  },
  {
    "HotelName": "Abrial",
    "MHID": "ttbL91i",
    "WVitemID": "138821",
    "NE_Code": "HNCEKYRI",
    "CAitemID": "59278",
    "TripadvisorLocationID": "196988"
  }
]
```
