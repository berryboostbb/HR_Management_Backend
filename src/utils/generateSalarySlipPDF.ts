import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { IPayroll } from "../models/payrollModel"; // import your Payroll type

/**
 * Generate Salary Slip PDF for a given payroll
 * @param payroll - Payroll object
 * @returns string - Path to the generated PDF
 */
export const generateSalarySlipPDF = async (
  payroll: IPayroll
): Promise<string> => {
  // Create directory if not exists
  const dirPath = path.join(process.cwd(), "uploads", "salary-slips");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // File name: use payroll _id to avoid duplicates
  const fileName = `salary-slip-${payroll._id}-${payroll.month}-${payroll.year}.pdf`;
  const filePath = path.join(dirPath, fileName);

  // Create PDF document
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(filePath));

  // ===== HEADER =====
  doc.fontSize(18).text("SALARY SLIP", { align: "center" });
  doc.moveDown();

  // ===== EMPLOYEE INFO =====
  doc.fontSize(12);
  doc.text(`Employee ID: ${payroll.employeeId}`);
  doc.text(`Month: ${payroll.month} ${payroll.year}`);
  doc.text(`Processed At: ${new Date(payroll.processedAt).toDateString()}`);
  doc.moveDown();

  // ===== SALARY DETAILS =====
  doc.text("EARNINGS", { underline: true });
  doc.text(`Basic Salary: ${payroll.basicSalary}`);
  doc.text(`Medical Allowance: ${payroll.allowances.medical}`);
  doc.text(`Transport Allowance: ${payroll.allowances.transport}`);
  doc.text(`Other Allowance: ${payroll.allowances.others}`);
  doc.moveDown();

  doc.text("DEDUCTIONS", { underline: true });
  doc.text(`PF: ${payroll.deductions.pf}`);
  doc.text(`Loan: ${payroll.deductions.loan}`);
  doc.text(`Advance Salary: ${payroll.deductions.advanceSalary}`);
  doc.text(`Tax: ${payroll.deductions.tax}`);
  doc.text(`Other: ${payroll.deductions.custom}`);
  doc.moveDown();

  // ===== TOTAL =====
  doc
    .fontSize(14)
    .text(`Net Salary: ${payroll.totalSalary}`, { align: "right" });

  doc.end();

  // Return relative path for storing in DB
  return `/uploads/salary-slips/${fileName}`;
};
