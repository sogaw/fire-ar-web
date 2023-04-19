import {
  CollectionReference,
  doc,
  DocumentData,
  DocumentSnapshot,
  getDoc,
  getDocs,
  Query,
  query,
  where,
} from 'firebase/firestore';

export class FireCollection<TTransformed extends { data: DocumentData }> {
  ref: CollectionReference;
  transformer: (snap: DocumentSnapshot) => TTransformed;

  constructor(ref: CollectionReference, transformer: (snap: DocumentSnapshot) => TTransformed) {
    this.ref = ref;
    this.transformer = transformer;
  }

  async findOne(id: string) {
    const snap = await getDoc(doc(this.ref, id));
    if (!snap.exists() || !snap.data())
      throw new Error('snap.exists() or snap.data() are undefined');
    return this.transformer(snap);
  }

  async findOneById(id: string) {
    const snap = await getDoc(doc(this.ref, id));
    if (!snap.exists() || !snap.data()) return undefined;
    return this.transformer(snap);
  }

  async findManyByQuery(queryFn: (ref: CollectionReference) => Query) {
    const snap = await getDocs(queryFn(this.ref));
    return snap.docs.map(this.transformer);
  }
}

export class FireCollectionGroup<TTransformed extends { data: DocumentData }> {
  ref: Query;
  idField: string;
  transformer: (snap: DocumentSnapshot) => TTransformed;

  constructor(
    ref: Query,
    idField: keyof TTransformed['data'],
    transformer: (snap: DocumentSnapshot) => TTransformed
  ) {
    if (typeof idField !== 'string') throw new Error('idField not string');
    this.ref = ref;
    this.idField = idField;
    this.transformer = transformer;
  }

  async findOne(id: string) {
    const snap = await getDocs(query(this.ref, where(this.idField, '==', id)));
    const [doc] = snap.docs;
    if (!doc) throw new Error('snap not found');
    return this.transformer(doc);
  }

  findOneById(id: string) {
    return this.findOne(id).catch(() => undefined);
  }

  async findManyByQuery(queryFn: (ref: Query) => Query) {
    const snap = await getDocs(queryFn(this.ref));
    return snap.docs.map(this.transformer);
  }
}
