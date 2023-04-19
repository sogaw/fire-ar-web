import {
  CollectionReference,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  setDoc,
} from 'firebase/firestore';

type Constructor<T, TData extends DocumentData> = {
  new (id: string, ref: DocumentReference, data: TData): T;
};

type FireDocumentObject<TData extends DocumentData> = {
  id: string;
  ref: DocumentReference;
} & TData;

export class FireDocument<TData extends DocumentData> {
  constructor(public id: string, public ref: DocumentReference, public data: TData) {}

  static build<T, TData extends DocumentData>(
    this: Constructor<T, TData>,
    { ref }: { ref: CollectionReference },
    id: string | null,
    data: TData
  ) {
    const docRef = id ? doc(ref, id) : doc(ref);
    return new this(docRef.id, docRef, data);
  }

  static fromSnapshot<T, TData extends DocumentData>(
    this: Constructor<T, TData>,
    snapshot: DocumentSnapshot
  ) {
    return new this(snapshot.id, snapshot.ref, snapshot.data() as TData);
  }

  static fromObject<T, TData extends DocumentData>(
    this: Constructor<T, TData>,
    object: FireDocumentObject<TData>
  ) {
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
