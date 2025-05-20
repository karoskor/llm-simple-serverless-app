## Run frontend on local
In order to run the fronten app on local
```sh
cd frontend # to enter directory

npm install # install all required packages
npm start # start local server
```

## Frontend manual deployment

### Step 1: Build your React app (same as before)

```sh
cd frontend
npm run build
```

### Step 2: Create an S3 bucket (keep it private)
1. Create a bucket with a name like "<account_number>-learning-plan-app"
2. Keep "Block all public access" enabled
3. Complete the bucket creation

### Step 3: Upload your build files to S3

```sh
aws s3 sync build/ s3://<account_number>-learning-plan-app
```

### Step 4: Create a CloudFront distribution

1. Go to CloudFront in the AWS Console
2. Click "Create Distribution"
3. For "Origin Domain", select your S3 bucket
4. For "Origin Access", select "Origin access control settings (recommended)"
5. Create a new OAC (Origin Access Control) or use an existing one
6. Under "Default cache behavior", set "Viewer protocol policy" to "Redirect HTTP to HTTPS"
7. For "Default root object", enter "index.html"
8. Click "Create distribution"

### Step 5: Update S3 bucket policy with CloudFront OAC
After creating the distribution, CloudFront will provide a bucket policy to copy. Go to your S3 bucket permissions and paste this policy. It will look something like:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::<account_number>-learning-plan-app/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::<account_number>:distribution/YOUR_DISTRIBUTION_ID"
                }
            }
        }
    ]
}
```

### Step 6: Configure error pages for SPA routing

1. Go to your CloudFront distribution
2. Go to the "Error Pages" tab
3. Click "Create custom error response"
4. For "HTTP error code", select "403: Forbidden"
5. Select "Yes" for "Customize error response"
6. Set "Response page path" to "/index.html"
7. Set "HTTP Response code" to "200: OK"
8. Repeat for "404: Not Found" error code

### Step 7: Access your website
Your website will be available at the CloudFront domain that you can look up in AWS console.
