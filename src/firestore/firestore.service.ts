import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer'; // Nodemailer import

@Injectable()
export class FirestoreService {
  private firestore: admin.firestore.Firestore;

  constructor() {
    if (admin.apps.length === 0) {
      const decodedKey = Buffer.from(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        'base64',
      ).toString('utf-8');
      const firebaseConfig = JSON.parse(decodedKey);

      try {
        admin.initializeApp({
          credential: admin.credential.cert(firebaseConfig),
        });
        this.firestore = admin.firestore();
        console.log('Firestore initialized successfully');
      } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
      }
    } else {
      this.firestore = admin.firestore(); // If app is already initialized
      console.log('Firestore already initialized');
    }
  }

  // Save contact message to Firestore
  async saveMessage(name: string, email: string, message: string) {
    if (!this.firestore) {
      console.error('Firestore is not initialized.');
      throw new Error('Firestore not initialized.');
    }

    const docRef = this.firestore.collection('contacts').doc();
    await docRef.set({
      name,
      email,
      message,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isReplied: false, // Flag to track whether the message has been replied to
    });
    console.log('Message saved to Firestore');
  }

  // Get all contact messages from Firestore
  async getMessages() {
    if (!this.firestore) {
      console.error('Firestore is not initialized.');
      throw new Error('Firestore not initialized.');
    }

    const snapshot = await this.firestore.collection('contacts').get();
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Get a single message by ID
  async getMessageById(contactId: string) {
    if (!this.firestore) {
      console.error('Firestore is not initialized.');
      throw new Error('Firestore not initialized.');
    }

    const contactRef = this.firestore.collection('contacts').doc(contactId);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      throw new Error('Contact message not found');
    }

    return {
      id: contactDoc.id,
      ...contactDoc.data(),
    };
  }

  // Reply to a contact message and send email reply
  async replyToMessage(contactId: string, replyMessage: string) {
    if (!this.firestore) {
      console.error('Firestore is not initialized.');
      throw new Error('Firestore not initialized.');
    }

    const contactRef = this.firestore.collection('contacts').doc(contactId);
    const contactDoc = await contactRef.get();

    if (!contactDoc.exists) {
      throw new Error('Contact message not found');
    }

    const contactData = contactDoc.data();
    const toEmail = contactData?.email;

    // Sending email reply
    await this.sendEmail(toEmail, 'Reply to Your Message', replyMessage);

    // Mark the message as replied in Firestore
    await contactRef.update({
      isReplied: true,
      replyMessage, // Store the reply message
      repliedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('Reply sent and message marked as replied');
  }

  // Send an email reply using Nodemailer
  private async sendEmail(toEmail: string, subject: string, text: string) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', // Example SMTP host (Gmail)
      port: 587, // For TLS
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // From email
      to: toEmail, // Recipient email
      subject: subject,
      text: text,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${toEmail}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email reply');
    }
  }
}
