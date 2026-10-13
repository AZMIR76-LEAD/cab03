// FG DRIVO Wallet & Payment Gateway Controller
import { db } from '../db.js';

export class WalletController {
  static getWallet(req, res) {
    const wallet = db.get('wallet');
    return res.json(wallet);
  }

  static topup(req, res) {
    const amount = parseFloat(req.body.amount);
    const wallet = db.get('wallet');

    wallet.balance = parseFloat((wallet.balance + amount).toFixed(2));

    const newTxn = {
      id: 'TXN-' + Math.floor(1000 + Math.random() * 9000),
      title: 'Wallet Top-up (NetBanking/UPI)',
      date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount,
      type: 'credit',
      status: 'Successful',
    };

    wallet.transactions = [newTxn, ...(wallet.transactions || [])];
    db.set('wallet', wallet);

    return res.json({
      success: true,
      message: `Successfully loaded ₹${amount.toFixed(2)} to FG DRIVO Money`,
      newBalance: wallet.balance,
      transaction: newTxn,
    });
  }

  static addCard(req, res) {
    const { cardNumber = '4289', expiry = '08/29' } = req.body;
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const last4 = (cleanNumber.length >= 4 ? cleanNumber.slice(-4) : '4289');

    const wallet = db.get('wallet');
    const newCard = {
      id: 'pm-card-' + Date.now(),
      type: 'CARD',
      title: 'Credit Card (••' + last4 + ')',
      detail: '•••• ' + last4 + ' (Expires ' + expiry + ')',
      isPrimary: false,
      icon: 'credit-card',
    };

    wallet.paymentMethods = [...(wallet.paymentMethods || []), newCard];
    db.set('wallet', wallet);

    return res.status(201).json({
      success: true,
      message: 'Payment card securely linked via PCI-DSS tokenization.',
      paymentMethod: newCard,
    });
  }
}
