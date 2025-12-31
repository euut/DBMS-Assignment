## Setup

Clone the repo:

```bash
git clone https://github.com/euut/DBMS-Assignment.git
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the root directory and paste this inside:

```bash
MONGODB_URI=your_mongodb_uri
SESSION_SECRET=any_random_string
```

- `your_mongodb_uri` → Replace this with your actual MongoDB URI (local or Atlas)
- `any_random_string` → Can be anything

Run server:

```bash
npm run dev
```

## Dataset

Download dataset [here](https://imailsunwayedu-my.sharepoint.com/:f:/g/personal/23030992_imail_sunway_edu_my/EsmUGbi1QptJqXgf-DAGuq8BRVEIobH68WGHVKJSp5qQrQ?e=2fnKWr). You might have to restore the `.archive` using [mongorestore](https://www.mongodb.com/try/download/database-tools):

```bash
mongorestore --uri="your_mongodb_uri" --archive=path_to_your_archive_file
```

- `your_mongodb_uri` → Replace this with your actual MongoDB URI (local or Atlas)
- `path_to_your_archive_file` → Replace this with the correct path to your `.archive` file
