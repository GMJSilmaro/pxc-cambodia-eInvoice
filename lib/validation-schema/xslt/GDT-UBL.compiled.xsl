<?xml version="1.0" encoding="UTF-8"?>
<xsl:transform xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cn="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" xmlns:dn="urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2" xmlns:error="https://doi.org/10.5281/zenodo.1495494#error" xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDataTypes-2" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:sch="http://purl.oclc.org/dsdl/schematron" xmlns:schxslt-api="https://doi.org/10.5281/zenodo.1495494#api" xmlns:schxslt="https://doi.org/10.5281/zenodo.1495494" xmlns:ubl="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:udt="urn:oasis:names:specification:ubl:schema:xsd:UnqualifiedDataTypes-2" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0">
   <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dct="http://purl.org/dc/terms/" xmlns:skos="http://www.w3.org/2004/02/skos/core#">
      <dct:creator>
         <dct:Agent>
            <skos:prefLabel>SchXslt/1.9.5 SaxonJS/2.6</skos:prefLabel>
            <schxslt.compile.typed-variables xmlns="https://doi.org/10.5281/zenodo.1495494#">true</schxslt.compile.typed-variables>
         </dct:Agent>
      </dct:creator>
      <dct:created>2024-04-04T17:32:12.799+07:00</dct:created>
   </rdf:Description>
   <xsl:output indent="yes"/>
   <xsl:template match="root()">
      <xsl:variable name="metadata" as="element()?">
         <svrl:metadata xmlns:dct="http://purl.org/dc/terms/" xmlns:skos="http://www.w3.org/2004/02/skos/core#" xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
            <dct:creator>
               <dct:Agent>
                  <skos:prefLabel>
                     <xsl:value-of separator="/" select="(system-property('xsl:product-name'), system-property('xsl:product-version'))"/>
                  </skos:prefLabel>
               </dct:Agent>
            </dct:creator>
            <dct:created>
               <xsl:value-of select="current-dateTime()"/>
            </dct:created>
            <dct:source>
               <rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/">
                  <dct:creator>
                     <dct:Agent>
                        <skos:prefLabel>SchXslt/1.9.5 SaxonJS/2.6</skos:prefLabel>
                        <schxslt.compile.typed-variables xmlns="https://doi.org/10.5281/zenodo.1495494#">true</schxslt.compile.typed-variables>
                     </dct:Agent>
                  </dct:creator>
                  <dct:created>2024-04-04T17:32:12.799+07:00</dct:created>
               </rdf:Description>
            </dct:source>
         </svrl:metadata>
      </xsl:variable>
      <xsl:variable name="report" as="element(schxslt:report)">
         <schxslt:report>
            <xsl:call-template name="d71aZ"/>
         </schxslt:report>
      </xsl:variable>
      <xsl:variable name="schxslt:report" as="node()*">
         <xsl:sequence select="$metadata"/>
         <xsl:for-each select="$report/schxslt:document">
            <xsl:for-each select="schxslt:pattern">
               <xsl:sequence select="node()"/>
               <xsl:sequence select="../schxslt:rule[@pattern = current()/@id]/node()"/>
            </xsl:for-each>
         </xsl:for-each>
      </xsl:variable>
      <svrl:schematron-output xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
         <svrl:ns-prefix-in-attribute-values prefix="ext" uri="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"/>
         <svrl:ns-prefix-in-attribute-values prefix="cbc" uri="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"/>
         <svrl:ns-prefix-in-attribute-values prefix="cac" uri="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"/>
         <svrl:ns-prefix-in-attribute-values prefix="qdt" uri="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDataTypes-2"/>
         <svrl:ns-prefix-in-attribute-values prefix="udt" uri="urn:oasis:names:specification:ubl:schema:xsd:UnqualifiedDataTypes-2"/>
         <svrl:ns-prefix-in-attribute-values prefix="cn" uri="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"/>
         <svrl:ns-prefix-in-attribute-values prefix="ubl" uri="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"/>
         <svrl:ns-prefix-in-attribute-values prefix="dn" uri="urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2"/>
         <svrl:ns-prefix-in-attribute-values prefix="xs" uri="http://www.w3.org/2001/XMLSchema"/>
         <xsl:sequence select="$schxslt:report"/>
      </svrl:schematron-output>
   </xsl:template>
   <xsl:template match="text() | @*" mode="#all" priority="-10"/>
   <xsl:template match="/" mode="#all" priority="-10">
      <xsl:apply-templates mode="#current" select="node()"/>
   </xsl:template>
   <xsl:template match="*" mode="#all" priority="-10">
      <xsl:apply-templates mode="#current" select="@*"/>
      <xsl:apply-templates mode="#current" select="node()"/>
   </xsl:template>
   <xsl:template name="d71aZ">
      <schxslt:document>
         <schxslt:pattern id="d71aZ">
            <xsl:if test="exists(base-uri(root()))">
               <xsl:attribute name="documents" select="base-uri(root())"/>
            </xsl:if>
            <xsl:for-each select="root()">
               <svrl:active-pattern xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
                  <xsl:attribute name="documents" select="base-uri(.)"/>
               </svrl:active-pattern>
            </xsl:for-each>
         </schxslt:pattern>
         <schxslt:pattern id="d71aAB">
            <xsl:if test="exists(base-uri(root()))">
               <xsl:attribute name="documents" select="base-uri(root())"/>
            </xsl:if>
            <xsl:for-each select="root()">
               <svrl:active-pattern xmlns:svrl="http://purl.oclc.org/dsdl/svrl" name="UBL-model" id="UBL-model">
                  <xsl:attribute name="documents" select="base-uri(.)"/>
               </svrl:active-pattern>
            </xsl:for-each>
         </schxslt:pattern>
         <schxslt:pattern id="d71aAD">
            <xsl:if test="exists(base-uri(root()))">
               <xsl:attribute name="documents" select="base-uri(root())"/>
            </xsl:if>
            <xsl:for-each select="root()">
               <svrl:active-pattern xmlns:svrl="http://purl.oclc.org/dsdl/svrl" name="Codesmodel" id="Codesmodel">
                  <xsl:attribute name="documents" select="base-uri(.)"/>
               </svrl:active-pattern>
            </xsl:for-each>
         </schxslt:pattern>
         <xsl:apply-templates mode="d71aZ" select="root()"/>
      </schxslt:document>
   </xsl:template>
   <xsl:template match="//*[not(*) and not(normalize-space())]" priority="8" mode="d71aZ">
      <xsl:param name="schxslt:patterns-matched" as="xs:string*"/>
      <xsl:choose>
         <xsl:when test="$schxslt:patterns-matched[. = 'd71aZ']">
            <schxslt:rule pattern="d71aZ">
               <xsl:comment xmlns:svrl="http://purl.oclc.org/dsdl/svrl">WARNING: Rule for context "//*[not(*) and not(normalize-space())]" shadowed by preceding rule</xsl:comment>
               <svrl:suppressed-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
                  <xsl:attribute name="context">//*[not(*) and not(normalize-space())]</xsl:attribute>
               </svrl:suppressed-rule>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="$schxslt:patterns-matched"/>
            </xsl:next-match>
         </xsl:when>
         <xsl:otherwise>
            <schxslt:rule pattern="d71aZ">
               <svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
                  <xsl:attribute name="context">//*[not(*) and not(normalize-space())]</xsl:attribute>
               </svrl:fired-rule>
               <xsl:if test="not(false())">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="CAMINV-01">
                     <xsl:attribute name="test">false()</xsl:attribute>
                     <svrl:text>Document MUST not contain empty elements.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="($schxslt:patterns-matched, 'd71aZ')"/>
            </xsl:next-match>
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>
   <xsl:template match="/ubl:Invoice | /cn:CreditNote | /dn:DebitNote" priority="7" mode="d71aZ">
      <xsl:param name="schxslt:patterns-matched" as="xs:string*"/>
      <xsl:choose>
         <xsl:when test="$schxslt:patterns-matched[. = 'd71aAB']">
            <schxslt:rule pattern="d71aAB">
               <xsl:comment xmlns:svrl="http://purl.oclc.org/dsdl/svrl">WARNING: Rule for context "/ubl:Invoice | /cn:CreditNote | /dn:DebitNote" shadowed by preceding rule</xsl:comment>
               <svrl:suppressed-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
                  <xsl:attribute name="context">/ubl:Invoice | /cn:CreditNote | /dn:DebitNote</xsl:attribute>
               </svrl:suppressed-rule>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="$schxslt:patterns-matched"/>
            </xsl:next-match>
         </xsl:when>
         <xsl:otherwise>
            <schxslt:rule pattern="d71aAB">
               <svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
                  <xsl:attribute name="context">/ubl:Invoice | /cn:CreditNote | /dn:DebitNote</xsl:attribute>
               </svrl:fired-rule>
               <xsl:if test="not(normalize-space(cbc:ID) != '')">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-01">
                     <xsl:attribute name="test">normalize-space(cbc:ID) != ''</xsl:attribute>
                     <svrl:text>[GDT-01]-An Invoice shall have an Invoice number.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(normalize-space(cbc:IssueDate) != '')">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-02">
                     <xsl:attribute name="test">normalize-space(cbc:IssueDate) != ''</xsl:attribute>
                     <svrl:text>[GDT-02]-An Invoice shall have an Invoice issue date.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(normalize-space(cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName) != '')">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-03">
                     <xsl:attribute name="test">normalize-space(cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName) != ''</xsl:attribute>
                     <svrl:text>[GDT-03]-An Invoice shall contain the Seller name.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(normalize-space(cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName) != '')">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-04">
                     <xsl:attribute name="test">normalize-space(cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName) != ''</xsl:attribute>
                     <svrl:text>[GDT-04]-An Invoice shall contain the Buyer name.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(normalize-space(cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyID) != '')">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-05">
                     <xsl:attribute name="test">normalize-space(cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyID) != ''</xsl:attribute>
                     <svrl:text>[GDT-05]-An Invoice shall contain the Seller CompanyID or VAT Identification Number.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(normalize-space(cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyID) != '')">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-06">
                     <xsl:attribute name="test">normalize-space(cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyID) != ''</xsl:attribute>
                     <svrl:text>[GDT-06]-An Invoice shall contain the Buyer CompanyID or VAT Identification Number.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(exists(cac:AccountingSupplierParty/cac:Party/cac:PostalAddress))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-07">
                     <xsl:attribute name="test">exists(cac:AccountingSupplierParty/cac:Party/cac:PostalAddress)</xsl:attribute>
                     <svrl:text>[GDT-07]-An Invoice shall contain the Seller postal address. </svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(exists(cac:AccountingCustomerParty/cac:Party/cac:PostalAddress))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-08">
                     <xsl:attribute name="test">exists(cac:AccountingCustomerParty/cac:Party/cac:PostalAddress)</xsl:attribute>
                     <svrl:text>[GDT-08]-An Invoice shall contain the Buyer postal address.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(exists(cac:InvoiceLine) or exists(cac:CreditNoteLine) or exists(cac:DebitNoteLine))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-09">
                     <xsl:attribute name="test">exists(cac:InvoiceLine) or exists(cac:CreditNoteLine) or exists(cac:DebitNoteLine)</xsl:attribute>
                     <svrl:text>[GDT-09]-An Invoice shall have at least one Invoice line.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="($schxslt:patterns-matched, 'd71aAB')"/>
            </xsl:next-match>
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>
   <xsl:template match="cac:InvoiceLine | cac:CreditNoteLine | cac:DebitNoteLine" priority="6" mode="d71aZ">
      <xsl:param name="schxslt:patterns-matched" as="xs:string*"/>
      <xsl:choose>
         <xsl:when test="$schxslt:patterns-matched[. = 'd71aAB']">
            <schxslt:rule pattern="d71aAB">
               <xsl:comment xmlns:svrl="http://purl.oclc.org/dsdl/svrl">WARNING: Rule for context "cac:InvoiceLine | cac:CreditNoteLine | cac:DebitNoteLine" shadowed by preceding rule</xsl:comment>
               <svrl:suppressed-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
                  <xsl:attribute name="context">cac:InvoiceLine | cac:CreditNoteLine | cac:DebitNoteLine</xsl:attribute>
               </svrl:suppressed-rule>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="$schxslt:patterns-matched"/>
            </xsl:next-match>
         </xsl:when>
         <xsl:otherwise>
            <schxslt:rule pattern="d71aAB">
               <svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
                  <xsl:attribute name="context">cac:InvoiceLine | cac:CreditNoteLine | cac:DebitNoteLine</xsl:attribute>
               </svrl:fired-rule>
               <xsl:if test="not(normalize-space(cbc:ID) != '')">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-11">
                     <xsl:attribute name="test">normalize-space(cbc:ID) != ''</xsl:attribute>
                     <svrl:text>[GDT-11]-Each Invoice line shall have an Invoice line identifier.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(exists(cbc:InvoicedQuantity) or exists(cbc:CreditedQuantity) or exists(cbc:DebitedQuantity))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-12">
                     <xsl:attribute name="test">exists(cbc:InvoicedQuantity) or exists(cbc:CreditedQuantity) or exists(cbc:DebitedQuantity)</xsl:attribute>
                     <svrl:text>[GDT-12]-Each Invoice line shall have an Invoiced quantity.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(exists(cbc:LineExtensionAmount))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-13">
                     <xsl:attribute name="test">exists(cbc:LineExtensionAmount)</xsl:attribute>
                     <svrl:text>[GDT-13]-Each Invoice line shall have an Invoice line net amount.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(normalize-space(cac:Item/cbc:Name) != '')">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-14">
                     <xsl:attribute name="test">normalize-space(cac:Item/cbc:Name) != ''</xsl:attribute>
                     <svrl:text>[GDT-14]-Each Invoice line shall contain the Item name.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not(exists(cac:Price/cbc:PriceAmount))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-15">
                     <xsl:attribute name="test">exists(cac:Price/cbc:PriceAmount)</xsl:attribute>
                     <svrl:text>[GDT-15]-Each Invoice line shall contain the Item net price.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
               <xsl:if test="not((cac:Price/cbc:PriceAmount) &gt;= 0)">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-16">
                     <xsl:attribute name="test">(cac:Price/cbc:PriceAmount) &gt;= 0</xsl:attribute>
                     <svrl:text>[GDT-16]-The Item net price shall NOT be negative.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="($schxslt:patterns-matched, 'd71aAB')"/>
            </xsl:next-match>
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>
   <xsl:template match="/*/cac:TaxTotal/cac:TaxSubtotal" priority="5" mode="d71aZ">
      <xsl:param name="schxslt:patterns-matched" as="xs:string*"/>
      <xsl:choose>
         <xsl:when test="$schxslt:patterns-matched[. = 'd71aAB']">
            <schxslt:rule pattern="d71aAB">
               <xsl:comment xmlns:svrl="http://purl.oclc.org/dsdl/svrl">WARNING: Rule for context "/*/cac:TaxTotal/cac:TaxSubtotal" shadowed by preceding rule</xsl:comment>
               <svrl:suppressed-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
                  <xsl:attribute name="context">/*/cac:TaxTotal/cac:TaxSubtotal</xsl:attribute>
               </svrl:suppressed-rule>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="$schxslt:patterns-matched"/>
            </xsl:next-match>
         </xsl:when>
         <xsl:otherwise>
            <schxslt:rule pattern="d71aAB">
               <svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl">
                  <xsl:attribute name="context">/*/cac:TaxTotal/cac:TaxSubtotal</xsl:attribute>
               </svrl:fired-rule>
               <xsl:if test="not(exists(cbc:TaxAmount))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-21">
                     <xsl:attribute name="test">exists(cbc:TaxAmount)</xsl:attribute>
                     <svrl:text>[GDT-21]-Each Tax Subtotal shall include the Tax Amount.</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="($schxslt:patterns-matched, 'd71aAB')"/>
            </xsl:next-match>
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>
   <xsl:template match="cbc:Amount | cbc:BaseAmount | cbc:PriceAmount | cbc:TaxAmount | cbc:TaxableAmount | cbc:LineExtensionAmount | cbc:TaxExclusiveAmount | cbc:TaxInclusiveAmount | cbc:AllowanceTotalAmount | cbc:ChargeTotalAmount | cbc:PrepaidAmount | cbc:PayableRoundingAmount | cbc:PayableAmount" priority="4" mode="d71aZ">
      <xsl:param name="schxslt:patterns-matched" as="xs:string*"/>
      <xsl:choose>
         <xsl:when test="$schxslt:patterns-matched[. = 'd71aAD']">
            <schxslt:rule pattern="d71aAD">
               <xsl:comment xmlns:svrl="http://purl.oclc.org/dsdl/svrl">WARNING: Rule for context "cbc:Amount | cbc:BaseAmount | cbc:PriceAmount | cbc:TaxAmount | cbc:TaxableAmount | cbc:LineExtensionAmount | cbc:TaxExclusiveAmount | cbc:TaxInclusiveAmount | cbc:AllowanceTotalAmount | cbc:ChargeTotalAmount | cbc:PrepaidAmount | cbc:PayableRoundingAmount | cbc:PayableAmount" shadowed by preceding rule</xsl:comment>
               <svrl:suppressed-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" flag="fatal">
                  <xsl:attribute name="context">cbc:Amount | cbc:BaseAmount | cbc:PriceAmount | cbc:TaxAmount | cbc:TaxableAmount | cbc:LineExtensionAmount | cbc:TaxExclusiveAmount | cbc:TaxInclusiveAmount | cbc:AllowanceTotalAmount | cbc:ChargeTotalAmount | cbc:PrepaidAmount | cbc:PayableRoundingAmount | cbc:PayableAmount</xsl:attribute>
               </svrl:suppressed-rule>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="$schxslt:patterns-matched"/>
            </xsl:next-match>
         </xsl:when>
         <xsl:otherwise>
            <schxslt:rule pattern="d71aAD">
               <svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" flag="fatal">
                  <xsl:attribute name="context">cbc:Amount | cbc:BaseAmount | cbc:PriceAmount | cbc:TaxAmount | cbc:TaxableAmount | cbc:LineExtensionAmount | cbc:TaxExclusiveAmount | cbc:TaxInclusiveAmount | cbc:AllowanceTotalAmount | cbc:ChargeTotalAmount | cbc:PrepaidAmount | cbc:PayableRoundingAmount | cbc:PayableAmount</xsl:attribute>
               </svrl:fired-rule>
               <xsl:if test="not(((not(contains(normalize-space(@currencyID), ' ')) and contains(' AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL ', concat(' ', normalize-space(@currencyID), ' ')))))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-CL-03">
                     <xsl:attribute name="test">((not(contains(normalize-space(@currencyID), ' ')) and contains(' AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL ', concat(' ', normalize-space(@currencyID), ' '))))</xsl:attribute>
                     <svrl:text>[GDT-CL-03]-currencyID MUST be coded using ISO code list 4217 alpha-3</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="($schxslt:patterns-matched, 'd71aAD')"/>
            </xsl:next-match>
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>
   <xsl:template match="cbc:DocumentCurrencyCode" priority="3" mode="d71aZ">
      <xsl:param name="schxslt:patterns-matched" as="xs:string*"/>
      <xsl:choose>
         <xsl:when test="$schxslt:patterns-matched[. = 'd71aAD']">
            <schxslt:rule pattern="d71aAD">
               <xsl:comment xmlns:svrl="http://purl.oclc.org/dsdl/svrl">WARNING: Rule for context "cbc:DocumentCurrencyCode" shadowed by preceding rule</xsl:comment>
               <svrl:suppressed-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" flag="fatal">
                  <xsl:attribute name="context">cbc:DocumentCurrencyCode</xsl:attribute>
               </svrl:suppressed-rule>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="$schxslt:patterns-matched"/>
            </xsl:next-match>
         </xsl:when>
         <xsl:otherwise>
            <schxslt:rule pattern="d71aAD">
               <svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" flag="fatal">
                  <xsl:attribute name="context">cbc:DocumentCurrencyCode</xsl:attribute>
               </svrl:fired-rule>
               <xsl:if test="not(((not(contains(normalize-space(.), ' ')) and contains(' AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL ', concat(' ', normalize-space(.), ' ')))))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-CL-04">
                     <xsl:attribute name="test">((not(contains(normalize-space(.), ' ')) and contains(' AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL ', concat(' ', normalize-space(.), ' '))))</xsl:attribute>
                     <svrl:text>[GDT-CL-04]-Invoice currency code MUST be coded using ISO code list 4217 alpha-3</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="($schxslt:patterns-matched, 'd71aAD')"/>
            </xsl:next-match>
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>
   <xsl:template match="cbc:TaxCurrencyCode" priority="2" mode="d71aZ">
      <xsl:param name="schxslt:patterns-matched" as="xs:string*"/>
      <xsl:choose>
         <xsl:when test="$schxslt:patterns-matched[. = 'd71aAD']">
            <schxslt:rule pattern="d71aAD">
               <xsl:comment xmlns:svrl="http://purl.oclc.org/dsdl/svrl">WARNING: Rule for context "cbc:TaxCurrencyCode" shadowed by preceding rule</xsl:comment>
               <svrl:suppressed-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" flag="fatal">
                  <xsl:attribute name="context">cbc:TaxCurrencyCode</xsl:attribute>
               </svrl:suppressed-rule>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="$schxslt:patterns-matched"/>
            </xsl:next-match>
         </xsl:when>
         <xsl:otherwise>
            <schxslt:rule pattern="d71aAD">
               <svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" flag="fatal">
                  <xsl:attribute name="context">cbc:TaxCurrencyCode</xsl:attribute>
               </svrl:fired-rule>
               <xsl:if test="not(((not(contains(normalize-space(.), ' ')) and contains(' AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL ', concat(' ', normalize-space(.), ' ')))))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-CL-05">
                     <xsl:attribute name="test">((not(contains(normalize-space(.), ' ')) and contains(' AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL ', concat(' ', normalize-space(.), ' '))))</xsl:attribute>
                     <svrl:text>[GDT-CL-05]-Tax currency code MUST be coded using ISO code list 4217 alpha-3</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="($schxslt:patterns-matched, 'd71aAD')"/>
            </xsl:next-match>
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>
   <xsl:template match="cac:TaxCategory/cbc:ID" priority="1" mode="d71aZ">
      <xsl:param name="schxslt:patterns-matched" as="xs:string*"/>
      <xsl:choose>
         <xsl:when test="$schxslt:patterns-matched[. = 'd71aAD']">
            <schxslt:rule pattern="d71aAD">
               <xsl:comment xmlns:svrl="http://purl.oclc.org/dsdl/svrl">WARNING: Rule for context "cac:TaxCategory/cbc:ID" shadowed by preceding rule</xsl:comment>
               <svrl:suppressed-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" flag="fatal">
                  <xsl:attribute name="context">cac:TaxCategory/cbc:ID</xsl:attribute>
               </svrl:suppressed-rule>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="$schxslt:patterns-matched"/>
            </xsl:next-match>
         </xsl:when>
         <xsl:otherwise>
            <schxslt:rule pattern="d71aAD">
               <svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" flag="fatal">
                  <xsl:attribute name="context">cac:TaxCategory/cbc:ID</xsl:attribute>
               </svrl:fired-rule>
               <xsl:if test="not(( ( not(contains(normalize-space(.),' ')) and contains( ' AE L M E S Z G O K B ',concat(' ',normalize-space(.),' ') ) ) ))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-CL-17">
                     <xsl:attribute name="test">( ( not(contains(normalize-space(.),' ')) and contains( ' AE L M E S Z G O K B ',concat(' ',normalize-space(.),' ') ) ) )</xsl:attribute>
                     <svrl:text>[GDT-CL-17]-Invoice tax categories MUST be coded using UNCL5305 code list</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="($schxslt:patterns-matched, 'd71aAD')"/>
            </xsl:next-match>
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>
   <xsl:template match="cac:TaxCategory/cac:TaxScheme/cbc:ID" priority="0" mode="d71aZ">
      <xsl:param name="schxslt:patterns-matched" as="xs:string*"/>
      <xsl:choose>
         <xsl:when test="$schxslt:patterns-matched[. = 'd71aAD']">
            <schxslt:rule pattern="d71aAD">
               <xsl:comment xmlns:svrl="http://purl.oclc.org/dsdl/svrl">WARNING: Rule for context "cac:TaxCategory/cac:TaxScheme/cbc:ID" shadowed by preceding rule</xsl:comment>
               <svrl:suppressed-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" flag="fatal">
                  <xsl:attribute name="context">cac:TaxCategory/cac:TaxScheme/cbc:ID</xsl:attribute>
               </svrl:suppressed-rule>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="$schxslt:patterns-matched"/>
            </xsl:next-match>
         </xsl:when>
         <xsl:otherwise>
            <schxslt:rule pattern="d71aAD">
               <svrl:fired-rule xmlns:svrl="http://purl.oclc.org/dsdl/svrl" flag="fatal">
                  <xsl:attribute name="context">cac:TaxCategory/cac:TaxScheme/cbc:ID</xsl:attribute>
               </svrl:fired-rule>
               <xsl:if test="not(( ( not(contains(normalize-space(.),' ')) and contains( ' VAT SP PLT AT ',concat(' ',normalize-space(.),' ') ) ) ))">
                  <svrl:failed-assert xmlns:svrl="http://purl.oclc.org/dsdl/svrl" location="{schxslt:location(.)}" flag="fatal" id="GDT-CL-18">
                     <xsl:attribute name="test">( ( not(contains(normalize-space(.),' ')) and contains( ' VAT SP PLT AT ',concat(' ',normalize-space(.),' ') ) ) )</xsl:attribute>
                     <svrl:text>[GDT-CL-18]-Invoice tax categories MUST be one of the following: VAT (Value Added Tax), SP (Specific Tax), PLT(Public Lighting Tax), AT(Accommodation Tax)</svrl:text>
                  </svrl:failed-assert>
               </xsl:if>
            </schxslt:rule>
            <xsl:next-match>
               <xsl:with-param name="schxslt:patterns-matched" as="xs:string*" select="($schxslt:patterns-matched, 'd71aAD')"/>
            </xsl:next-match>
         </xsl:otherwise>
      </xsl:choose>
   </xsl:template>
   <xsl:function name="schxslt:location" as="xs:string">
      <xsl:param name="node" as="node()"/>
      <xsl:variable name="segments" as="xs:string*">
         <xsl:for-each select="($node/ancestor-or-self::node())">
            <xsl:variable name="position">
               <xsl:number level="single"/>
            </xsl:variable>
            <xsl:choose>
               <xsl:when test=". instance of element()">
                  <xsl:value-of select="concat('Q{', namespace-uri(.), '}', local-name(.), '[', $position, ']')"/>
               </xsl:when>
               <xsl:when test=". instance of attribute()">
                  <xsl:value-of select="concat('@Q{', namespace-uri(.), '}', local-name(.))"/>
               </xsl:when>
               <xsl:when test=". instance of processing-instruction()">
                  <xsl:value-of select="concat('processing-instruction(&#34;', name(.), '&#34;)[', $position, ']')"/>
               </xsl:when>
               <xsl:when test=". instance of comment()">
                  <xsl:value-of select="concat('comment()[', $position, ']')"/>
               </xsl:when>
               <xsl:when test=". instance of text()">
                  <xsl:value-of select="concat('text()[', $position, ']')"/>
               </xsl:when>
               <xsl:otherwise/>
            </xsl:choose>
         </xsl:for-each>
      </xsl:variable>
      <xsl:value-of select="concat('/', string-join($segments, '/'))"/>
   </xsl:function>
</xsl:transform>