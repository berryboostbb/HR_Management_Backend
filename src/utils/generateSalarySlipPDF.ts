import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { IPayroll } from "../models/payrollModel";

export const generateSalarySlipPDF = async (
  payroll: IPayroll
): Promise<string> => {
  const dirPath = path.join(process.cwd(), "uploads", "salary-slips");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const fileName = `salary-slip-${payroll._id}-${payroll.month}-${payroll.year}.pdf`;
  const filePath = path.join(dirPath, fileName);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  // ===== LETTERHEAD =====
  doc
    .fontSize(20)
    .text("Your Company Name", { align: "center", bold: true })
    .moveDown(0.2);
  doc
    .fontSize(12)
    .text("Company Address Line 1, City, Country", { align: "center" });
  doc.fontSize(12).text("Phone: +123-456-7890 | Email: info@company.com", {
    align: "center",
  });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke(); // underline
  doc.moveDown();

  // ===== TITLE =====
  doc.fontSize(18).text("SALARY SLIP", { align: "center", underline: true });
  doc.moveDown();

  // ===== EMPLOYEE INFO =====
  doc.fontSize(12).text(`Employee ID: ${payroll.employeeId}`);
  doc.text(`Month: ${payroll.month} ${payroll.year}`);
  doc.text(`Processed At: ${new Date(payroll.processedAt).toDateString()}`);
  doc.moveDown();

  // ===== TABLE HEADERS =====
  const startX = 50;
  let startY = doc.y;
  const tableWidth = 500;

  doc.font("Helvetica-Bold");
  doc.text("Earnings", startX, startY, {
    width: tableWidth / 2,
    align: "left",
  });
  doc.text("Amount", startX + tableWidth / 2, startY, {
    width: tableWidth / 2,
    align: "right",
  });
  startY += 20;
  doc.font("Helvetica");

  const earnings = [
    { title: "Basic Salary", amount: payroll.basicSalary },
    { title: "Medical Allowance", amount: payroll.allowances.medical },
    { title: "Transport Allowance", amount: payroll.allowances.transport },
    { title: "Other Allowance", amount: payroll.allowances.others },
  ];

  earnings.forEach((item) => {
    doc.text(item.title, startX, startY, {
      width: tableWidth / 2,
      align: "left",
    });
    doc.text(item.amount.toFixed(2), startX + tableWidth / 2, startY, {
      width: tableWidth / 2,
      align: "right",
    });
    startY += 20;
  });

  startY += 10;
  doc.font("Helvetica-Bold");
  doc.text("Deductions", startX, startY, {
    width: tableWidth / 2,
    align: "left",
  });
  doc.text("Amount", startX + tableWidth / 2, startY, {
    width: tableWidth / 2,
    align: "right",
  });
  startY += 20;
  doc.font("Helvetica");

  const deductions = [
    { title: "PF", amount: payroll.deductions.pf },
    { title: "Loan", amount: payroll.deductions.loan },
    { title: "Advance Salary", amount: payroll.deductions.advanceSalary },
    { title: "Tax", amount: payroll.deductions.tax },
    { title: "Other", amount: payroll.deductions.custom },
  ];

  deductions.forEach((item) => {
    doc.text(item.title, startX, startY, {
      width: tableWidth / 2,
      align: "left",
    });
    doc.text(item.amount.toFixed(2), startX + tableWidth / 2, startY, {
      width: tableWidth / 2,
      align: "right",
    });
    startY += 20;
  });

  startY += 20;
  doc.font("Helvetica-Bold");
  doc.fontSize(14);
  doc.text("Net Salary", startX, startY, {
    width: tableWidth / 2,
    align: "left",
  });
  doc.text(payroll.totalSalary.toFixed(2), startX + tableWidth / 2, startY, {
    width: tableWidth / 2,
    align: "right",
  });

  doc.end();

  return `/uploads/salary-slips/${fileName}`;
};
