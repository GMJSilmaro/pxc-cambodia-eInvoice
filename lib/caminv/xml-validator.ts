import { CamInvError, CamInvErrorCode, logger } from './error-handler';
import path from 'path';
import fs from 'fs';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  line?: number;
  column?: number;
  severity: 'fatal' | 'error';
}

export interface ValidationWarning {
  code: string;
  message: string;
  line?: number;
  column?: number;
}

export class CamInvXMLValidator {
  private static readonly SCHEMA_BASE_PATH = path.join(process.cwd(), 'lib', 'validation-schema');
  
  /**
   * Validate UBL XML against Cambodia GDT requirements
   */
  static async validateUBLXML(xml: string, documentType: 'invoice' | 'credit_note' | 'debit_note'): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Basic XML structure validation
      const basicValidation = this.validateBasicXMLStructure(xml);
      if (!basicValidation.isValid) {
        result.errors.push(...basicValidation.errors);
        result.isValid = false;
      }

      // Step 2: UBL Schema validation (XSD)
      const schemaValidation = await this.validateAgainstXSD(xml, documentType);
      if (!schemaValidation.isValid) {
        result.errors.push(...schemaValidation.errors);
        result.isValid = false;
      }

      // Step 3: Cambodia GDT business rules validation (Schematron)
      const businessRulesValidation = await this.validateBusinessRules(xml);
      result.errors.push(...businessRulesValidation.errors);
      result.warnings.push(...businessRulesValidation.warnings);
      
      if (businessRulesValidation.errors.length > 0) {
        result.isValid = false;
      }

      logger.info('UBL XML validation completed', {
        documentType,
        isValid: result.isValid,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });

    } catch (error) {
      logger.error('XML validation failed', error);
      result.isValid = false;
      result.errors.push({
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        severity: 'fatal'
      });
    }

    return result;
  }

  /**
   * Basic XML structure validation
   */
  private static validateBasicXMLStructure(xml: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Check if XML declaration exists
    if (!xml.trim().startsWith('<?xml')) {
      result.errors.push({
        code: 'XML_DECLARATION_MISSING',
        message: 'XML declaration is missing',
        severity: 'error'
      });
      result.isValid = false;
    }

    // Check for basic XML structure
    try {
      // Simple tag balance check
      const openTags = (xml.match(/<[^/!?][^>]*[^/]>/g) || []).length;
      const closeTags = (xml.match(/<\/[^>]+>/g) || []).length;
      const selfClosingTags = (xml.match(/<[^>]+\/>/g) || []).length;
      
      if (openTags !== closeTags + selfClosingTags) {
        result.errors.push({
          code: 'XML_STRUCTURE_INVALID',
          message: 'XML structure is invalid - unbalanced tags',
          severity: 'fatal'
        });
        result.isValid = false;
      }

      // Check for empty elements (Cambodia GDT requirement)
      const emptyElements = xml.match(/<[^>]+><\/[^>]+>/g);
      if (emptyElements && emptyElements.length > 0) {
        result.errors.push({
          code: 'CAMINV-01',
          message: 'Document MUST not contain empty elements',
          severity: 'fatal'
        });
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push({
        code: 'XML_PARSE_ERROR',
        message: 'Failed to parse XML structure',
        severity: 'fatal'
      });
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate against UBL XSD schemas
   */
  private static async validateAgainstXSD(xml: string, documentType: 'invoice' | 'credit_note' | 'debit_note'): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Get the appropriate XSD file
      const xsdFileName = this.getXSDFileName(documentType);
      const xsdPath = path.join(this.SCHEMA_BASE_PATH, 'maindoc', xsdFileName);

      // Check if XSD file exists
      if (!fs.existsSync(xsdPath)) {
        result.errors.push({
          code: 'SCHEMA_NOT_FOUND',
          message: `XSD schema file not found: ${xsdFileName}`,
          severity: 'fatal'
        });
        result.isValid = false;
        return result;
      }

      // Note: In a production environment, you would use a proper XML validation library
      // such as libxmljs2 or xmldom with schema validation capabilities
      // For now, we'll do basic namespace and root element validation

      const expectedNamespace = this.getExpectedNamespace(documentType);
      const expectedRootElement = this.getExpectedRootElement(documentType);

      if (!xml.includes(expectedNamespace)) {
        result.errors.push({
          code: 'NAMESPACE_INVALID',
          message: `Invalid namespace. Expected: ${expectedNamespace}`,
          severity: 'error'
        });
        result.isValid = false;
      }

      if (!xml.includes(`<${expectedRootElement}`)) {
        result.errors.push({
          code: 'ROOT_ELEMENT_INVALID',
          message: `Invalid root element. Expected: ${expectedRootElement}`,
          severity: 'error'
        });
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push({
        code: 'XSD_VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'XSD validation failed',
        severity: 'fatal'
      });
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate against Cambodia GDT business rules (Schematron)
   */
  private static async validateBusinessRules(xml: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Cambodia GDT specific validations based on GDT-UBL.sch
      
      // GDT-01: Invoice number is required
      if (!this.extractElementValue(xml, 'cbc:ID')) {
        result.errors.push({
          code: 'GDT-01',
          message: 'An Invoice shall have an Invoice number',
          severity: 'fatal'
        });
      }

      // GDT-02: Issue date is required
      if (!this.extractElementValue(xml, 'cbc:IssueDate')) {
        result.errors.push({
          code: 'GDT-02',
          message: 'An Invoice shall have an Invoice issue date',
          severity: 'fatal'
        });
      }

      // GDT-03: Seller name is required
      if (!this.extractElementValue(xml, 'cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName') &&
          !this.extractElementValue(xml, 'cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name')) {
        result.errors.push({
          code: 'GDT-03',
          message: 'An Invoice shall contain the Seller name',
          severity: 'fatal'
        });
      }

      // GDT-04: Buyer name is required
      if (!this.extractElementValue(xml, 'cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:RegistrationName') &&
          !this.extractElementValue(xml, 'cac:AccountingCustomerParty/cac:Party/cac:PartyName/cbc:Name')) {
        result.errors.push({
          code: 'GDT-04',
          message: 'An Invoice shall contain the Buyer name',
          severity: 'fatal'
        });
      }

      // GDT-05: Seller Company ID is required
      if (!this.extractElementValue(xml, 'cac:AccountingSupplierParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyID') &&
          !this.extractElementValue(xml, 'cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cbc:CompanyID')) {
        result.errors.push({
          code: 'GDT-05',
          message: 'An Invoice shall contain the Seller CompanyID or VAT Identification Number',
          severity: 'fatal'
        });
      }

      // GDT-06: Buyer Company ID is required
      if (!this.extractElementValue(xml, 'cac:AccountingCustomerParty/cac:Party/cac:PartyLegalEntity/cbc:CompanyID') &&
          !this.extractElementValue(xml, 'cac:AccountingCustomerParty/cac:Party/cac:PartyTaxScheme/cbc:CompanyID')) {
        result.errors.push({
          code: 'GDT-06',
          message: 'An Invoice shall contain the Buyer CompanyID or VAT Identification Number',
          severity: 'fatal'
        });
      }

      // GDT-07: Seller postal address is required
      const hasSupplierPostal = this.hasNestedElement(xml, 'cac:AccountingSupplierParty', 'cac:PostalAddress');
      console.log('GDT-07 Debug:', {
        hasSupplierPostal,
        hasSupplierParty: xml.includes('<cac:AccountingSupplierParty>'),
        hasPostalAddress: xml.includes('<cac:PostalAddress>')
      });
      if (!hasSupplierPostal) {
        result.errors.push({
          code: 'GDT-07',
          message: 'An Invoice shall contain the Seller postal address',
          severity: 'fatal'
        });
      }

      // GDT-08: Buyer postal address is required
      const hasCustomerPostal = this.hasNestedElement(xml, 'cac:AccountingCustomerParty', 'cac:PostalAddress');
      console.log('GDT-08 Debug:', {
        hasCustomerPostal,
        hasCustomerParty: xml.includes('<cac:AccountingCustomerParty>'),
        hasPostalAddress: xml.includes('<cac:PostalAddress>')
      });
      if (!hasCustomerPostal) {
        result.errors.push({
          code: 'GDT-08',
          message: 'An Invoice shall contain the Buyer postal address',
          severity: 'fatal'
        });
      }

      // GDT-09: At least one invoice line is required
      if (!xml.includes('cac:InvoiceLine') && !xml.includes('cac:CreditNoteLine') && !xml.includes('cac:DebitNoteLine')) {
        result.errors.push({
          code: 'GDT-09',
          message: 'An Invoice shall have at least one Invoice line',
          severity: 'fatal'
        });
      }

    } catch (error) {
      result.errors.push({
        code: 'BUSINESS_RULES_VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Business rules validation failed',
        severity: 'fatal'
      });
    }

    return result;
  }

  /**
   * Extract element value from XML (simple implementation)
   */
  private static extractElementValue(xml: string, elementPath: string): string | null {
    // This is a simplified implementation
    // In production, use a proper XML parser like xmldom or libxmljs2
    const elementName = elementPath.split('/').pop() || '';
    const regex = new RegExp(`<${elementName}[^>]*>([^<]*)<\/${elementName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Check if a nested element exists within a parent element
   */
  private static hasNestedElement(xml: string, parentElement: string, childElement: string): boolean {
    const parentStartTag = `<${parentElement}`;
    const parentEndTag = `</${parentElement}>`;
    const childTag = `<${childElement}`;

    const parentStart = xml.indexOf(parentStartTag);
    if (parentStart === -1) return false;

    const parentEnd = xml.indexOf(parentEndTag, parentStart);
    if (parentEnd === -1) return false;

    const childIndex = xml.indexOf(childTag, parentStart);
    return childIndex !== -1 && childIndex < parentEnd;
  }

  /**
   * Get XSD filename for document type
   */
  private static getXSDFileName(documentType: 'invoice' | 'credit_note' | 'debit_note'): string {
    switch (documentType) {
      case 'invoice':
        return 'UBL-Invoice-2.1.xsd';
      case 'credit_note':
        return 'UBL-CreditNote-2.1.xsd';
      case 'debit_note':
        return 'UBL-DebitNote-2.1.xsd';
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
  }

  /**
   * Get expected namespace for document type
   */
  private static getExpectedNamespace(documentType: 'invoice' | 'credit_note' | 'debit_note'): string {
    switch (documentType) {
      case 'invoice':
        return 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2';
      case 'credit_note':
        return 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2';
      case 'debit_note':
        return 'urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2';
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
  }

  /**
   * Get expected root element for document type
   */
  private static getExpectedRootElement(documentType: 'invoice' | 'credit_note' | 'debit_note'): string {
    switch (documentType) {
      case 'invoice':
        return 'Invoice';
      case 'credit_note':
        return 'CreditNote';
      case 'debit_note':
        return 'DebitNote';
      default:
        throw new Error(`Unsupported document type: ${documentType}`);
    }
  }
}
