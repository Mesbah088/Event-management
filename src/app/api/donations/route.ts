import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      donorName,
      donorUniversity,
      donorBatch,
      donorPhone,
      amount,
      trxId,
      reference,
      paymentMethod = 'bKash',
    } = body;

    const db = await getDb();
    const newDonation = {
      donorName: donorName ? String(donorName).trim() : 'Anonymous Donor',
      donorUniversity: donorUniversity ? String(donorUniversity).trim() : undefined,
      donorBatch: donorBatch ? String(donorBatch).trim() : undefined,
      donorPhone: donorPhone ? String(donorPhone).trim() : undefined,
      amount: amount ? Number(amount) || String(amount).trim() : undefined,
      trxId: trxId ? String(trxId).trim().toUpperCase() : undefined,
      reference: reference ? String(reference).trim() : 'Name_Versity_Batch',
      paymentMethod,
      eventSlug: 'niter-islamic-conference-2026',
      status: 'SUBMITTED',
      createdAt: new Date(),
    };

    await db.collection('donations').insertOne(newDonation);

    return NextResponse.json({
      success: true,
      message: 'জাযাকাল্লাহু খাইরান! আপনার অনুদানের তথ্য সফলভাবে সংরক্ষিত হয়েছে।',
    });
  } catch (error) {
    console.error('Error saving donation:', error);
    return NextResponse.json({ error: 'Failed to record donation' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const donations = await db
      .collection('donations')
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, donations });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch donations' }, { status: 500 });
  }
}
