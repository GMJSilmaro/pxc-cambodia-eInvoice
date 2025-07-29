<?xml version="1.0" encoding="UTF-8"?>
<!--Schematron version 1.3.10 - Last update: 2023-04-08-->
<schema xmlns="http://purl.oclc.org/dsdl/schematron" queryBinding="xslt2">
    <ns prefix="ext" uri="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2" />
    <ns prefix="cbc" uri="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" />
    <ns prefix="cac" uri="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" />
    <ns prefix="qdt" uri="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDataTypes-2" />
    <ns prefix="udt" uri="urn:oasis:names:specification:ubl:schema:xsd:UnqualifiedDataTypes-2" />
    <ns prefix="cn" uri="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2" />
    <ns prefix="ubl" uri="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" />
    <ns prefix="dn" uri="urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2" />
    <ns prefix="xs" uri="http://www.w3.org/2001/XMLSchema" />
    <phase id="GDTmodel_phase">
        <active pattern="UBL-model" />
    </phase>
    <phase id="codelist_phase">
        <active pattern="Codesmodel" />
    </phase>
    <!-- Empty elements -->
    <pattern>
        <rule context="//*[not(*) and not(normalize-space())]">
            <assert id="CAMINV-01" test="false()" flag="fatal">Document MUST not contain empty elements.</assert>
        </rule>
    </pattern>
    <pattern id="UBL-model">
        <!-- GDT  RULES -->
        <rule context="/ubl:Invoice | /cn:CreditNote | /dn:DebitNote">
            <assert id="GDT-01" flag="fatal" test="normalize-space(cbc:ID) != ''">[GDT-01]-An Invoice shall have an Invoice number.</assert>
            <assert id="GDT-02" flag="fatal" test="normalize-space(cbc:IssueDate) != ''">[GDT-02]-An Invoice shall have an Invoice issue date.</assert>
            <assert id="GDT-03" flag="fatal" test="normalize-space(cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName) != ''">[GDT-03]-An Invoice shall contain the Seller name.</assert>
            <assert id="GDT-04" flag="fatal" test="normalize-space(cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName) != ''">[GDT-04]-An Invoice shall contain the Buyer name.</assert>
            <assert id="GDT-05" flag="fatal" test="normalize-space(cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyID) != ''">[GDT-05]-An Invoice shall contain the Seller CompanyID or VAT Identification Number.</assert>
            <assert id="GDT-06" flag="fatal" test="normalize-space(cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyID) != ''">[GDT-06]-An Invoice shall contain the Buyer CompanyID or VAT Identification Number.</assert>
            <assert id="GDT-07" flag="fatal" test="exists(cac:AccountingSupplierParty/cac:Party/cac:PostalAddress)">[GDT-07]-An Invoice shall contain the Seller postal address. </assert>
            <assert id="GDT-08" flag="fatal" test="exists(cac:AccountingCustomerParty/cac:Party/cac:PostalAddress)">[GDT-08]-An Invoice shall contain the Buyer postal address.</assert>
            <assert id="GDT-09" flag="fatal" test="exists(cac:InvoiceLine) or exists(cac:CreditNoteLine) or exists(cac:DebitNoteLine)">[GDT-09]-An Invoice shall have at least one Invoice line.</assert>
        </rule>
        
        <rule context="cac:InvoiceLine | cac:CreditNoteLine | cac:DebitNoteLine">
            <assert id="GDT-11" flag="fatal" test="normalize-space(cbc:ID) != ''">[GDT-11]-Each Invoice line shall have an Invoice line identifier.</assert>
            <assert id="GDT-12" flag="fatal" test="exists(cbc:InvoicedQuantity) or exists(cbc:CreditedQuantity) or exists(cbc:DebitedQuantity)">[GDT-12]-Each Invoice line shall have an Invoiced quantity.</assert>
            <assert id="GDT-13" flag="fatal" test="exists(cbc:LineExtensionAmount)">[GDT-13]-Each Invoice line shall have an Invoice line net amount.</assert>
            <assert id="GDT-14" flag="fatal" test="normalize-space(cac:Item/cbc:Name) != ''">[GDT-14]-Each Invoice line shall contain the Item name.</assert>
            <assert id="GDT-15" flag="fatal" test="exists(cac:Price/cbc:PriceAmount)">[GDT-15]-Each Invoice line shall contain the Item net price.</assert>
            <assert id="GDT-16" flag="fatal" test="(cac:Price/cbc:PriceAmount) >= 0">[GDT-16]-The Item net price shall NOT be negative.</assert>
        </rule>
        <rule context="/*/cac:TaxTotal/cac:TaxSubtotal">
            <assert id="GDT-21" flag="fatal" test="exists(cbc:TaxAmount)">[GDT-21]-Each Tax Subtotal shall include the Tax Amount.</assert>
        </rule>
    </pattern>
    <pattern id="Codesmodel">
        <rule flag="fatal" context="cbc:Amount | cbc:BaseAmount | cbc:PriceAmount | cbc:TaxAmount | cbc:TaxableAmount | cbc:LineExtensionAmount | cbc:TaxExclusiveAmount | cbc:TaxInclusiveAmount | cbc:AllowanceTotalAmount | cbc:ChargeTotalAmount | cbc:PrepaidAmount | cbc:PayableRoundingAmount | cbc:PayableAmount">
            <assert id="GDT-CL-03" flag="fatal" test="((not(contains(normalize-space(@currencyID), ' ')) and contains(' AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL ', concat(' ', normalize-space(@currencyID), ' '))))">[GDT-CL-03]-currencyID MUST be coded using ISO code list 4217 alpha-3</assert>
        </rule>
        <rule flag="fatal" context="cbc:DocumentCurrencyCode">
            <assert id="GDT-CL-04" flag="fatal" test="((not(contains(normalize-space(.), ' ')) and contains(' AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL ', concat(' ', normalize-space(.), ' '))))">[GDT-CL-04]-Invoice currency code MUST be coded using ISO code list 4217 alpha-3</assert>
        </rule>
        <rule flag="fatal" context="cbc:TaxCurrencyCode">
            <assert id="GDT-CL-05" flag="fatal" test="((not(contains(normalize-space(.), ' ')) and contains(' AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BOV BRL BSD BTN BWP BYN BZD CAD CDF CHE CHF CHW CLF CLP CNY COP COU CRC CUC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HRK HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MXV MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD USN UYI UYU UYW UZS VES VND VUV WST XAF XAG XAU XBA XBB XBC XBD XCD XDR XOF XPD XPF XPT XSU XTS XUA XXX YER ZAR ZMW ZWL ', concat(' ', normalize-space(.), ' '))))">[GDT-CL-05]-Tax currency code MUST be coded using ISO code list 4217 alpha-3</assert>
        </rule>
        <rule flag="fatal" context="cac:TaxCategory/cbc:ID">
            <assert id="GDT-CL-17" flag="fatal" test="( ( not(contains(normalize-space(.),' ')) and contains( ' AE L M E S Z G O K B ',concat(' ',normalize-space(.),' ') ) ) )">[GDT-CL-17]-Invoice tax categories MUST be coded using UNCL5305 code list</assert>
        </rule>
        <rule flag="fatal" context="cac:TaxCategory/cac:TaxScheme/cbc:ID">
            <assert id="GDT-CL-18" flag="fatal" test="( ( not(contains(normalize-space(.),' ')) and contains( ' VAT SP PLT AT ',concat(' ',normalize-space(.),' ') ) ) )">[GDT-CL-18]-Invoice tax categories MUST be one of the following: VAT (Value Added Tax), SP (Specific Tax), PLT(Public Lighting Tax), AT(Accommodation Tax)</assert>
        </rule>
    </pattern>
</schema>
