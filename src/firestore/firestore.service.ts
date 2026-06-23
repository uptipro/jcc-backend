import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer'; // Nodemailer import
import { ensureFirebaseInitialized } from '../firebase/firebase-credential';

@Injectable()
export class FirestoreService {
  private firestore: admin.firestore.Firestore;

  constructor() {
    try {
      ensureFirebaseInitialized();
      this.firestore = admin.firestore();
      console.log('Firestore initialized successfully');
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error);
    }
  }

  private getDb(): admin.firestore.Firestore {
    if (!this.firestore) {
      throw new Error(
        'Firestore is not initialized. Verify FIREBASE_SERVICE_ACCOUNT_KEY is set and that Cloud Firestore is enabled for this Firebase project.',
      );
    }
    return this.firestore;
  }

  // Save contact message to Firestore
  async saveMessage(
    name: string,
    email: string,
    message: string,
    type?: string,
    churchEmail?: string,
  ) {
    if (!this.firestore) {
      console.error('Firestore is not initialized.');
      throw new Error('Firestore not initialized.');
    }

    const docRef = this.firestore.collection('contacts').doc();
    await docRef.set({
      name,
      email,
      message,
      type: type || 'contact_message',
      churchEmail: churchEmail || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isReplied: false, // Flag to track whether the message has been replied to
    });

    if (type === 'prayer_request' && churchEmail) {
      await this.sendEmail(
        churchEmail,
        `New Prayer Request from ${name}`,
        `Name: ${name}\nEmail: ${email}\n\nPrayer Request:\n${message}`,
      );
    }

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

  async saveSchedule(scheduleData: any) {
    const scheduleRef = this.firestore.collection('schedules').doc();
    await scheduleRef.set({ id: scheduleRef.id, ...scheduleData });
    return { id: scheduleRef.id, ...scheduleData };
  }

  async getSchedules() {
    const snapshot = await this.getDb().collection('schedules').get();
    return snapshot.docs.map((doc) => doc.data());
  }

  async getScheduleById(id: string) {
    const doc = await this.firestore.collection('schedules').doc(id).get();
    if (!doc.exists) throw new Error('Schedule not found');
    return doc.data();
  }

  async updateSchedule(id: string, updateData: any) {
    const scheduleRef = this.firestore.collection('schedules').doc(id);
    await scheduleRef.update(updateData);
    const updatedDoc = await scheduleRef.get();
    return updatedDoc.data();
  }

  async deleteSchedule(id: string) {
    await this.firestore.collection('schedules').doc(id).delete();
  }

  async saveSubscription(email: string) {
    await this.firestore.collection('subscriptions').add({ email });
  }

  async getSubscriptions() {
    const subscriptions = await this.firestore
      .collection('subscriptions')
      .get();
    return subscriptions.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  async getSubscriptionById(id: string) {
    const doc = await this.firestore.collection('subscriptions').doc(id).get();
    return doc.data();
  }

  async removeSubscription(id: string) {
    await this.firestore.collection('subscriptions').doc(id).delete();
  }

  async saveTrending(content: string) {
    const trendingRef = this.firestore.collection('trending').doc();
    const payload = {
      id: trendingRef.id,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await trendingRef.set(payload);
    return payload;
  }

  async getTrending() {
    const snapshot = await this.getDb()
      .collection('trending')
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt;
      return {
        ...data,
        id: doc.id,
        createdAt:
          createdAt instanceof admin.firestore.Timestamp
            ? createdAt.toDate().toISOString()
            : (createdAt ?? null),
      };
    });
  }

  async removeTrending(id: string) {
    await this.firestore.collection('trending').doc(id).delete();
  }
}
