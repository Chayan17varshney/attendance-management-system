function copyDatabase(newDBName) {
  if (typeof newDBName !== "string") {
    console.log("Usage: copyDatabase('targetdbname')");
    console.log("targetdbname must not exist");
    return;
  }

  var dbs = db.getMongo().getDBs().databases;
  for (var _db of dbs) {
    if (_db.name === newDBName) {
      console.log(
        `Target DB ${newDBName} already exists, cowardly refusing to do anything`
      );
      return false;
    }
  }

  var collectionInfos = db.getCollectionInfos();

  console.log(
    `Copying database ${db.getName()} to ${newDBName} (${
      collectionInfos.length
    } collections/views)`
  );

  var newDB = db.getSiblingDB(newDBName);

  for (var collectionInfo of collectionInfos.filter(
    (info) => info.type === "view"
  )) {
    var collName = collectionInfo.name;
    console.log(`  Copying view ${collName}...`);
    console.log(
      `    `,
      newDB.createView(
        collName,
        collectionInfo.options.viewOn,
        collectionInfo.options.pipeline
      )
    );
  }

  for (var collectionInfo of collectionInfos.filter(
    (info) => info.type === "collection"
  )) {
    var collName = collectionInfo.name;
    if (collName.startsWith("system.")) {
      console.log(`  Skipping system collection ${collName}`);
      continue;
    }

    console.log(`  Copying collection ${collName}...`);

    var coll = db.getCollection(collName);
    var newColl = newDB.getCollection(collName);

    var numdocs = coll.estimatedDocumentCount();
    console.log(`    Copying data (~${numdocs} docs)...`);
    coll.aggregate([{ $out: { db: newDBName, coll: collName } }]);

    console.log(`    Copying indexes...`);
    var indexes = coll.getIndexes();
    var indexSpecs = indexes.map((i) => i.key);
    console.log(`      `, indexSpecs);
    console.log(`      `, newColl.createIndexes(indexSpecs));
  }

  return true;
}
copyDatabase("WpDB");
