import nodemailer from "nodemailer";

export async function sendMail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) throw new Error("SMTP_NOT_CONFIGURED");
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: Number(process.env.SMTP_PORT) === 465, connectionTimeout:10000, greetingTimeout:10000, socketTimeout:15000, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } });
  await transport.sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to, subject, html });
}

export async function sendInquiryMail(to:string, academy:string, message:string) {
  const escape = (text:string) => text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const subject="Consulta de matrícula · "+academy.replace(/[\r\n]/g," ");
  const html="<p>"+escape(academy)+" recibió una consulta desde su web.</p><p>"+escape(message).replace(/\n/g,"<br>")+"</p>";
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    await sendMail(to,subject,html);
    return;
  }
  const {access,constants}=await import("node:fs/promises");
  const path="/usr/sbin/sendmail";
  await access(path,constants.X_OK);
  const host=process.env.SINGLE_ACADEMY_HOST || process.env.BASE_DOMAIN;
  if (!host || !/^[a-z0-9.-]+$/i.test(host)) throw new Error("SMTP_NOT_CONFIGURED");
  const transport=nodemailer.createTransport({sendmail:true,path,newline:"unix"});
  await transport.sendMail({from:process.env.EMAIL_FROM || "TT Academias <no-reply@"+host+">",to,subject,html,text:message});
}
