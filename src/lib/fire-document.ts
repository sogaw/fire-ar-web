import {
  CollectionReference,
  deleteDoc,
  doc,
  DocumentReference,
  DocumentSnapshot,
  setDoc,
} from 'firebase/firestore';

type Collection<TData> = { ref: CollectionReference<TData> };

type Constructor<T, TData> = { new (id: string, ref: DocumentReference<TData>, data: TData): T };

type FireDocumentObject<TData> = { id: string; ref: DocumentReference<TData> } & TData;

export class FireDocument<TData> {
  constructor(public id: string, public ref: DocumentReference<TData>, public data: TData) {}

  static build<T, TData>(
    this: Constructor<T, TData>,
    collection: Collection<TData>,
    id: string | null,
    data: TData
  ) {
    const docRef = id ? doc(collection.ref, id) : doc(collection.ref);
    return new this(docRef.id, docRef, data);
  }

  static fromSnapshot<T, TData>(
    this: Constructor<T, TData>,
    snapshot: Pick<DocumentSnapshot<TData>, 'id' | 'ref' | 'data'>
  ) {
    return new this(snapshot.id, snapshot.ref, snapshot.data() as TData);
  }

  static fromObject<T, TData>(this: Constructor<T, TData>, object: FireDocumentObject<TData>) {
    const { id, ref, ...data } = object;
    return new this(id, ref, data as unknown as TData);
  }

  toObject() {
    return { id: this.id, ref: this.ref, ...this.data };
  }

  toBatchInput() {
    return [this.ref, this.data] as const;
  }

  async save() {
    await setDoc(this.ref, this.data);
  }

  async destroy() {
    await deleteDoc(this.ref);
  }

  rebuild() {
    return new (this.constructor as Constructor<this, TData>)(this.id, this.ref, this.data);
  }
}
