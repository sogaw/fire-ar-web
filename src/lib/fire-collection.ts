import {
  CollectionReference,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  Query,
  query,
  where,
} from 'firebase/firestore';

type Snapshot<TData> = Pick<DocumentSnapshot<TData>, 'id' | 'ref' | 'data'>;

export class FireCollection<TData, TTransformed> {
  ref: CollectionReference<TData>;
  transformer: (snap: Snapshot<TData>) => TTransformed;

  constructor(ref: CollectionReference, transformer: (snap: Snapshot<TData>) => TTransformed) {
    this.ref = ref as CollectionReference<TData>;
    this.transformer = transformer;
  }

  async findOne(id: string) {
    const snap = await getDoc(doc(this.ref, id));
    if (!snap.exists() || !snap.data())
      throw new Error('snap.exists() or snap.data() are undefined');
    return this.transformer({
      id: snap.id,
      ref: snap.ref,
      data: () => snap.data(),
    });
  }

  async findOneById(id: string) {
    const snap = await getDoc(doc(this.ref, id));
    if (!snap.exists() || !snap.data()) return undefined;
    return this.transformer({
      id: snap.id,
      ref: snap.ref,
      data: () => snap.data(),
    });
  }

  async findManyByQuery(queryFn: (ref: CollectionReference<TData>) => Query<TData>) {
    const snap = await getDocs(queryFn(this.ref));
    return snap.docs.map(this.transformer);
  }
}

export class FireCollectionGroup<TData, TTransformed> {
  ref: Query<TData>;
  idField: string;
  transformer: (snap: Snapshot<TData>) => TTransformed;

  constructor(
    ref: Query,
    idField: keyof TData,
    transformer: (snap: Snapshot<TData>) => TTransformed
  ) {
    if (typeof idField !== 'string') throw new Error('idField not string');
    this.ref = ref as Query<TData>;
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

  async findManyByQuery(queryFn: (ref: Query<TData>) => Query<TData>) {
    const snap = await getDocs(queryFn(this.ref));
    return snap.docs.map(this.transformer);
  }
}
