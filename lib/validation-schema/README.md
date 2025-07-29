
## Generate Validation Schema for SCH Schematron

### Requirements
- npm install -g xslt3

### Generate XSL from SCH Using XSLT3
- npx xslt3 -xsl:src\validation-schema\schxslt-1.9.5\2.0\pipeline-for-svrl.xsl -s:src\validation-schema\sch\GDT-UBL.sch -o:src\validation-schema\xslt\GDT-UBL.compiled.xsl

### Generate sef.json from XSLT/XSL
- npx xslt3 -xsl:src\validation-schema\xslt\GDT-UBL.compiled.xsl -export:src\validation-schema\sef-json\GDT-UBL.sef.json -t 

### Use the sef.json to validate xml document with saxon-js
