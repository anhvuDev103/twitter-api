import { Collection, Db, MongoClient } from 'mongodb';
import User from '~/models/schemas/User.schema';

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@twitter.cnuqz91.mongodb.net/?retryWrites=true&w=majority`;

class DatabaseService {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(process.env.DB_NAME);
  }

  async connect() {
    try {
      // Send a ping to confirm a successful connection
      await this.db.command({
        ping: 1
      });
      console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } catch {
      console.log('[ERROR]: CLOSED THE SERVER!');
      // Ensures that the client will close when you finish/error
      await this.client.close();
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USER_COLLECTION as string);
  }
}

const databaseService = new DatabaseService();

export default databaseService;
