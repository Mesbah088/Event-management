const { MongoClient } = require('mongodb');

const uri =
  'mongodb://mrmesbah273_db_user:0X5iTGsqU0qdykem@ac-h7l5xxe-shard-00-00.2q4yzvq.mongodb.net:27017,ac-h7l5xxe-shard-00-01.2q4yzvq.mongodb.net:27017,ac-h7l5xxe-shard-00-02.2q4yzvq.mongodb.net:27017/university_events?ssl=true&replicaSet=atlas-kd2mfm-shard-0&authSource=admin&retryWrites=true&w=majority';

async function updateToNiter() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('university_events');

  // 1. Update events collection
  const updateResult = await db.collection('events').updateOne(
    { slug: 'niter-islamic-conference-2026' },
    {
      $set: {
        venue: 'NITER Central Field (নিটার কেন্দ্রীয় মাঠ)',
        description:
          'ঐতিহাসিক NITER ইসলামিক কনফারেন্স ২০২৬-এ প্রধান অতিথি হিসেবে উপস্থিত থাকবেন প্রখ্যাত ইসলামিক স্কলার শায়খ ড. মিজানুর রহমান আজহারী (চেয়ারম্যান, হাসানাহ ফাউন্ডেশন)। তারিখ: ৮-৯ নভেম্বর ২০২৬, স্থান: নিটার কেন্দ্রীয় মাঠ। আয়োজনে: NITER Islamic Society.',
        updatedAt: new Date(),
      },
    }
  );
  console.log('Events updated count:', updateResult.modifiedCount);

  // 2. Also check registrations collection for any 'নাইটার'
  const regs = await db
    .collection('registrations')
    .find({
      $or: [{ institution: /নাইটার/ }, { 'customFields.institution': /নাইটার/ }],
    })
    .toArray();
  console.log('Registrations with নাইটার:', regs.length);
  for (const r of regs) {
    const updatedInst = r.institution ? r.institution.replace(/নাইটার/g, 'নিটার') : r.institution;
    const updatedCustom = r.customFields?.institution
      ? r.customFields.institution.replace(/নাইটার/g, 'নিটার')
      : r.customFields?.institution;
    await db
      .collection('registrations')
      .updateOne(
        { _id: r._id },
        { $set: { institution: updatedInst, 'customFields.institution': updatedCustom } }
      );
  }

  // 3. Verify
  const verifiedEvent = await db
    .collection('events')
    .findOne({ slug: 'niter-islamic-conference-2026' });
  console.log('Verified Venue:', verifiedEvent.venue);
  console.log('Verified Description:', verifiedEvent.description);

  await client.close();
}

updateToNiter().catch(console.error);
