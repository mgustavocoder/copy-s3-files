import AWS from 'aws-sdk'
import constants from './constants.js'

process.env.AWS_ACCESS_KEY_ID = 'change-me'
process.env.AWS_SECRET_ACCESS_KEY = 'change-me'
process.env.AWS_SESSION_TOKEN = 'change-me'

const s3 = new AWS.S3()

async function run () {
  try {
    const s3Objects = await listBucket(s3)

    const logoKeys = filterObjectsByRegex(s3Objects)
    const copyPromises = groupCopyPromises(logoKeys)

    return Promise.all(copyPromises)
  } catch (error) {
    console.log(error)
  }
}
function groupCopyPromises (logoKeys) {
  return logoKeys.map(key => {
    const copyOptions = buildCopyOptions(key)
    return s3.copyObject(copyOptions).promise()
  })
}

function buildCopyOptions (key) {
  return {
    Bucket: constants.BUCKET,
    CopySource: `${constants.BUCKET}/${key}`,
    Key: `${constants.DESTINATION_PATH}${key.replace(constants.SOURCE_PATH, '')}`,
    CacheControl: constants.CACHE_CONTROL,
    MetadataDirective: constants.METADATA_DIRECTIVE
  }
}

function filterObjectsByRegex (s3Objects) {
  const s3ObjectKeys = s3Objects.map(object => object.Key)
  return s3ObjectKeys.filter(objectKey => objectKey.match(constants.REGEX))
}

async function listBucket () {
  const params = {
    Bucket: constants.BUCKET,
    Prefix: constants.SOURCE_PATH
  }

  let s3Objects = []
  let listObjectsResponse
  do {
    listObjectsResponse = await s3.listObjectsV2(params).promise()
    s3Objects.push(listObjectsResponse.Contents)
    params.ContinuationToken = listObjectsResponse.NextContinuationToken
  } while (listObjectsResponse.IsTruncated)

  s3Objects = s3Objects.flat()
  return s3Objects
}

run()
