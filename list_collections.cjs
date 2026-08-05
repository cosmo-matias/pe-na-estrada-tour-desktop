const admin = require("firebase-admin");

admin.initializeApp({
  projectId: "pe-na-estrada-tour",
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

async function list() {
  const collections = await db.listCollections();
  collections.forEach(collection => {
    console.log('Collection: ', collection.id);
  });
}
list();
