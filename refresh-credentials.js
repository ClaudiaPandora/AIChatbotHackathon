const { STSClient, GetSessionTokenCommand } = require('@aws-sdk/client-sts');

async function refreshCredentials() {
  try {
    const stsClient = new STSClient({ region: 'us-east-1' });
    
    const command = new GetSessionTokenCommand({
      DurationSeconds: 3600 // 1 hour
    });
    
    const response = await stsClient.send(command);
    const credentials = response.Credentials;
    
    console.log('✅ Fresh credentials obtained!');
    console.log('\nAdd these to your .env file:');
    console.log(`AWS_ACCESS_KEY_ID=${credentials.AccessKeyId}`);
    console.log(`AWS_SECRET_ACCESS_KEY=${credentials.SecretAccessKey}`);
    console.log(`AWS_SESSION_TOKEN=${credentials.SessionToken}`);
    
    return credentials;
  } catch (error) {
    console.log('❌ Failed to refresh credentials:', error.message);
    console.log('\nPlease run: aws configure');
    console.log('Or if using SSO: aws sso login');
    return null;
  }
}

if (require.main === module) {
  refreshCredentials();
}

module.exports = { refreshCredentials };
