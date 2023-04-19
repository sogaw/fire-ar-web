import {
  collection,
  collectionGroup,
  CollectionReference,
  doc,
  getDoc,
  orderBy,
  Query,
  query,
  setDoc,
} from 'firebase/firestore';

import { FireCollection, FireCollectionGroup, FireDocument } from '@/index';

import { getDb } from './test-setup';
import { clearFirestore } from './test-utils';

// Schema Define
interface UserData {
  name: string;
}
class UserDoc extends FireDocument<UserData> {
  postsCollection = new PostsCollection(collection(this.ref, 'posts'));
}

interface PostData {
  __id: string;
  content: string;
}
class PostDoc extends FireDocument<PostData> {}

class UsersCollection extends FireCollection<UserDoc> {
  constructor(ref: CollectionReference) {
    super(ref, (ref) => UserDoc.fromSnapshot(ref));
  }

  orderedByNameDesc() {
    return this.findManyByQuery((ref) => query(ref, orderBy('name', 'desc')));
  }
}

class PostsCollection extends FireCollection<PostDoc> {
  constructor(ref: CollectionReference) {
    super(ref, (ref) => PostDoc.fromSnapshot(ref));
  }
}

class PostsCollectionGroup extends FireCollectionGroup<PostDoc> {
  constructor(ref: Query) {
    super(ref, '__id', (ref) => PostDoc.fromSnapshot(ref));
  }

  orderedByContentDesc() {
    return this.findManyByQuery((ref) => query(ref, orderBy('content', 'desc')));
  }
}

// Connect DB
const usersRef = collection(getDb(), 'users');
const postsRefGroup = collectionGroup(getDb(), 'posts');
const usersCollection = new UsersCollection(usersRef);
const postsCollectionGroup = new PostsCollectionGroup(postsRefGroup);

// Test
beforeEach(async () => {
  await clearFirestore();
});
afterAll(async () => {
  await clearFirestore();
});

describe('Document', () => {
  it('create', async () => {
    const user = UserDoc.build(usersCollection, '1', { name: 'Taro' });
    await user.save();

    const gotUser = await getDoc(doc(usersRef, '1'));
    expect(gotUser.data()).toStrictEqual({ name: 'Taro' });
  });

  it('update', async () => {
    const user = UserDoc.build(usersCollection, '1', { name: 'Taro' });
    await user.save();
    user.data.name = 'Big Taro';
    await user.save();

    const gotUser = await getDoc(doc(usersRef, '1'));
    expect(gotUser.data()).toStrictEqual({ name: 'Big Taro' });
  });

  it('delete', async () => {
    const user = UserDoc.build(usersCollection, '1', { name: 'Taro' });
    await user.save();
    await user.destroy();

    const gotUser = await getDoc(doc(usersRef, '1'));
    expect(gotUser.exists()).toBe(false);
  });
});

describe('Collection', () => {
  beforeEach(async () => {
    await setDoc(doc(usersRef, '1'), { name: 'user-1' });
    await setDoc(doc(usersRef, '2'), { name: 'user-2' });
    await setDoc(doc(usersRef, '3'), { name: 'user-3' });
  });

  it('findOne', async () => {
    const user = await usersCollection.findOne('1');

    expect(user.id).toBe('1');
    expect(user.data).toStrictEqual({ name: 'user-1' });
  });

  it('not findOne, throw Error', async () => {
    await expect(usersCollection.findOne('100')).rejects.toThrowError();
  });

  it('findOneById', async () => {
    const user = await usersCollection.findOneById('1');

    expect(user?.id).toBe('1');
    expect(user?.data).toStrictEqual({ name: 'user-1' });
  });

  it('findManyByQuery', async () => {
    const users = await usersCollection.orderedByNameDesc();

    expect(users.map((u) => u.id)).toStrictEqual(['3', '2', '1']);
  });
});

describe('CollectionGroup', () => {
  const userOnePostsRef = collection(usersRef, '1', 'posts');

  beforeEach(async () => {
    await setDoc(doc(userOnePostsRef, '1'), { __id: '1', content: 'post-1' });
    await setDoc(doc(userOnePostsRef, '2'), { __id: '2', content: 'post-2' });
    await setDoc(doc(userOnePostsRef, '3'), { __id: '3', content: 'post-3' });
  });

  it('findOne', async () => {
    const post = await postsCollectionGroup.findOne('1');

    expect(post.id).toBe('1');
    expect(post.data).toStrictEqual({ __id: '1', content: 'post-1' });
  });

  it('not findOne, throw Error', async () => {
    await expect(postsCollectionGroup.findOne('100')).rejects.toThrowError();
  });

  it('findOneById', async () => {
    const post = await postsCollectionGroup.findOne('1');

    expect(post.id).toBe('1');
    expect(post.data).toStrictEqual({ __id: '1', content: 'post-1' });
  });

  it('findManyByQuery', async () => {
    const posts = await postsCollectionGroup.orderedByContentDesc();

    expect(posts.map((p) => p.id)).toStrictEqual(['3', '2', '1']);
  });
});
