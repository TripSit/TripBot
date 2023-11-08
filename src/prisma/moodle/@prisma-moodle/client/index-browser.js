
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  detectRuntime,
} = require('./runtime/index-browser')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.5.2
 * Query Engine version: aebc046ce8b88ebbcb45efe31cbe7d06fd6abc0a
 */
Prisma.prismaVersion = {
  client: "5.5.2",
  engine: "aebc046ce8b88ebbcb45efe31cbe7d06fd6abc0a"
}

Prisma.PrismaClientKnownRequestError = () => {
  throw new Error(`PrismaClientKnownRequestError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  throw new Error(`PrismaClientUnknownRequestError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientRustPanicError = () => {
  throw new Error(`PrismaClientRustPanicError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientInitializationError = () => {
  throw new Error(`PrismaClientInitializationError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientValidationError = () => {
  throw new Error(`PrismaClientValidationError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.NotFoundError = () => {
  throw new Error(`NotFoundError is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  throw new Error(`sqltag is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.empty = () => {
  throw new Error(`empty is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.join = () => {
  throw new Error(`join is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.raw = () => {
  throw new Error(`raw is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  throw new Error(`Extensions.getExtensionContext is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.defineExtension = () => {
  throw new Error(`Extensions.defineExtension is unable to be run ${runtimeDescription}.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.Mdl_adminpresetsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  name: 'name',
  comments: 'comments',
  site: 'site',
  author: 'author',
  moodleversion: 'moodleversion',
  moodlerelease: 'moodlerelease',
  iscore: 'iscore',
  timecreated: 'timecreated',
  timeimported: 'timeimported'
};

exports.Prisma.Mdl_adminpresets_appScalarFieldEnum = {
  id: 'id',
  adminpresetid: 'adminpresetid',
  userid: 'userid',
  time: 'time'
};

exports.Prisma.Mdl_adminpresets_app_itScalarFieldEnum = {
  id: 'id',
  adminpresetapplyid: 'adminpresetapplyid',
  configlogid: 'configlogid'
};

exports.Prisma.Mdl_adminpresets_app_it_aScalarFieldEnum = {
  id: 'id',
  adminpresetapplyid: 'adminpresetapplyid',
  configlogid: 'configlogid',
  itemname: 'itemname'
};

exports.Prisma.Mdl_adminpresets_app_plugScalarFieldEnum = {
  id: 'id',
  adminpresetapplyid: 'adminpresetapplyid',
  plugin: 'plugin',
  name: 'name',
  value: 'value',
  oldvalue: 'oldvalue'
};

exports.Prisma.Mdl_adminpresets_itScalarFieldEnum = {
  id: 'id',
  adminpresetid: 'adminpresetid',
  plugin: 'plugin',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_adminpresets_it_aScalarFieldEnum = {
  id: 'id',
  itemid: 'itemid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_adminpresets_plugScalarFieldEnum = {
  id: 'id',
  adminpresetid: 'adminpresetid',
  plugin: 'plugin',
  name: 'name',
  enabled: 'enabled'
};

exports.Prisma.Mdl_analytics_indicator_calcScalarFieldEnum = {
  id: 'id',
  starttime: 'starttime',
  endtime: 'endtime',
  contextid: 'contextid',
  sampleorigin: 'sampleorigin',
  sampleid: 'sampleid',
  indicator: 'indicator',
  value: 'value',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_analytics_modelsScalarFieldEnum = {
  id: 'id',
  enabled: 'enabled',
  trained: 'trained',
  name: 'name',
  target: 'target',
  indicators: 'indicators',
  timesplitting: 'timesplitting',
  predictionsprocessor: 'predictionsprocessor',
  version: 'version',
  contextids: 'contextids',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_analytics_models_logScalarFieldEnum = {
  id: 'id',
  modelid: 'modelid',
  version: 'version',
  evaluationmode: 'evaluationmode',
  target: 'target',
  indicators: 'indicators',
  timesplitting: 'timesplitting',
  score: 'score',
  info: 'info',
  dir: 'dir',
  timecreated: 'timecreated',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_analytics_predict_samplesScalarFieldEnum = {
  id: 'id',
  modelid: 'modelid',
  analysableid: 'analysableid',
  timesplitting: 'timesplitting',
  rangeindex: 'rangeindex',
  sampleids: 'sampleids',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_analytics_prediction_actionsScalarFieldEnum = {
  id: 'id',
  predictionid: 'predictionid',
  userid: 'userid',
  actionname: 'actionname',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_analytics_predictionsScalarFieldEnum = {
  id: 'id',
  modelid: 'modelid',
  contextid: 'contextid',
  sampleid: 'sampleid',
  rangeindex: 'rangeindex',
  prediction: 'prediction',
  predictionscore: 'predictionscore',
  calculations: 'calculations',
  timecreated: 'timecreated',
  timestart: 'timestart',
  timeend: 'timeend'
};

exports.Prisma.Mdl_analytics_train_samplesScalarFieldEnum = {
  id: 'id',
  modelid: 'modelid',
  analysableid: 'analysableid',
  timesplitting: 'timesplitting',
  sampleids: 'sampleids',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_analytics_used_analysablesScalarFieldEnum = {
  id: 'id',
  modelid: 'modelid',
  action: 'action',
  analysableid: 'analysableid',
  firstanalysis: 'firstanalysis',
  timeanalysed: 'timeanalysed'
};

exports.Prisma.Mdl_analytics_used_filesScalarFieldEnum = {
  id: 'id',
  modelid: 'modelid',
  fileid: 'fileid',
  action: 'action',
  time: 'time'
};

exports.Prisma.Mdl_assignScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  alwaysshowdescription: 'alwaysshowdescription',
  nosubmissions: 'nosubmissions',
  submissiondrafts: 'submissiondrafts',
  sendnotifications: 'sendnotifications',
  sendlatenotifications: 'sendlatenotifications',
  duedate: 'duedate',
  allowsubmissionsfromdate: 'allowsubmissionsfromdate',
  grade: 'grade',
  timemodified: 'timemodified',
  requiresubmissionstatement: 'requiresubmissionstatement',
  completionsubmit: 'completionsubmit',
  cutoffdate: 'cutoffdate',
  gradingduedate: 'gradingduedate',
  teamsubmission: 'teamsubmission',
  requireallteammemberssubmit: 'requireallteammemberssubmit',
  teamsubmissiongroupingid: 'teamsubmissiongroupingid',
  blindmarking: 'blindmarking',
  hidegrader: 'hidegrader',
  revealidentities: 'revealidentities',
  attemptreopenmethod: 'attemptreopenmethod',
  maxattempts: 'maxattempts',
  markingworkflow: 'markingworkflow',
  markingallocation: 'markingallocation',
  sendstudentnotifications: 'sendstudentnotifications',
  preventsubmissionnotingroup: 'preventsubmissionnotingroup',
  activity: 'activity',
  activityformat: 'activityformat',
  timelimit: 'timelimit',
  submissionattachments: 'submissionattachments'
};

exports.Prisma.Mdl_assign_gradesScalarFieldEnum = {
  id: 'id',
  assignment: 'assignment',
  userid: 'userid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  grader: 'grader',
  grade: 'grade',
  attemptnumber: 'attemptnumber'
};

exports.Prisma.Mdl_assign_overridesScalarFieldEnum = {
  id: 'id',
  assignid: 'assignid',
  groupid: 'groupid',
  userid: 'userid',
  sortorder: 'sortorder',
  allowsubmissionsfromdate: 'allowsubmissionsfromdate',
  duedate: 'duedate',
  cutoffdate: 'cutoffdate',
  timelimit: 'timelimit'
};

exports.Prisma.Mdl_assign_plugin_configScalarFieldEnum = {
  id: 'id',
  assignment: 'assignment',
  plugin: 'plugin',
  subtype: 'subtype',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_assign_submissionScalarFieldEnum = {
  id: 'id',
  assignment: 'assignment',
  userid: 'userid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  timestarted: 'timestarted',
  status: 'status',
  groupid: 'groupid',
  attemptnumber: 'attemptnumber',
  latest: 'latest'
};

exports.Prisma.Mdl_assign_user_flagsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  assignment: 'assignment',
  locked: 'locked',
  mailed: 'mailed',
  extensionduedate: 'extensionduedate',
  workflowstate: 'workflowstate',
  allocatedmarker: 'allocatedmarker'
};

exports.Prisma.Mdl_assign_user_mappingScalarFieldEnum = {
  id: 'id',
  assignment: 'assignment',
  userid: 'userid'
};

exports.Prisma.Mdl_assignfeedback_commentsScalarFieldEnum = {
  id: 'id',
  assignment: 'assignment',
  grade: 'grade',
  commenttext: 'commenttext',
  commentformat: 'commentformat'
};

exports.Prisma.Mdl_assignfeedback_editpdf_annotScalarFieldEnum = {
  id: 'id',
  gradeid: 'gradeid',
  pageno: 'pageno',
  x: 'x',
  y: 'y',
  endx: 'endx',
  endy: 'endy',
  path: 'path',
  type: 'type',
  colour: 'colour',
  draft: 'draft'
};

exports.Prisma.Mdl_assignfeedback_editpdf_cmntScalarFieldEnum = {
  id: 'id',
  gradeid: 'gradeid',
  x: 'x',
  y: 'y',
  width: 'width',
  rawtext: 'rawtext',
  pageno: 'pageno',
  colour: 'colour',
  draft: 'draft'
};

exports.Prisma.Mdl_assignfeedback_editpdf_quickScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  rawtext: 'rawtext',
  width: 'width',
  colour: 'colour'
};

exports.Prisma.Mdl_assignfeedback_editpdf_rotScalarFieldEnum = {
  id: 'id',
  gradeid: 'gradeid',
  pageno: 'pageno',
  pathnamehash: 'pathnamehash',
  isrotated: 'isrotated',
  degree: 'degree'
};

exports.Prisma.Mdl_assignfeedback_fileScalarFieldEnum = {
  id: 'id',
  assignment: 'assignment',
  grade: 'grade',
  numfiles: 'numfiles'
};

exports.Prisma.Mdl_assignmentScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  assignmenttype: 'assignmenttype',
  resubmit: 'resubmit',
  preventlate: 'preventlate',
  emailteachers: 'emailteachers',
  var1: 'var1',
  var2: 'var2',
  var3: 'var3',
  var4: 'var4',
  var5: 'var5',
  maxbytes: 'maxbytes',
  timedue: 'timedue',
  timeavailable: 'timeavailable',
  grade: 'grade',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_assignment_submissionsScalarFieldEnum = {
  id: 'id',
  assignment: 'assignment',
  userid: 'userid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  numfiles: 'numfiles',
  data1: 'data1',
  data2: 'data2',
  grade: 'grade',
  submissioncomment: 'submissioncomment',
  format: 'format',
  teacher: 'teacher',
  timemarked: 'timemarked',
  mailed: 'mailed'
};

exports.Prisma.Mdl_assignment_upgradeScalarFieldEnum = {
  id: 'id',
  oldcmid: 'oldcmid',
  oldinstance: 'oldinstance',
  newcmid: 'newcmid',
  newinstance: 'newinstance',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_assignsubmission_fileScalarFieldEnum = {
  id: 'id',
  assignment: 'assignment',
  submission: 'submission',
  numfiles: 'numfiles'
};

exports.Prisma.Mdl_assignsubmission_onlinetextScalarFieldEnum = {
  id: 'id',
  assignment: 'assignment',
  submission: 'submission',
  onlinetext: 'onlinetext',
  onlineformat: 'onlineformat'
};

exports.Prisma.Mdl_auth_lti_linked_loginScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  issuer: 'issuer',
  issuer256: 'issuer256',
  sub: 'sub',
  sub256: 'sub256',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_auth_oauth2_linked_loginScalarFieldEnum = {
  id: 'id',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified',
  userid: 'userid',
  issuerid: 'issuerid',
  username: 'username',
  email: 'email',
  confirmtoken: 'confirmtoken',
  confirmtokenexpires: 'confirmtokenexpires'
};

exports.Prisma.Mdl_auth_oidc_prevloginScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  method: 'method',
  password: 'password'
};

exports.Prisma.Mdl_auth_oidc_stateScalarFieldEnum = {
  id: 'id',
  sesskey: 'sesskey',
  state: 'state',
  nonce: 'nonce',
  timecreated: 'timecreated',
  additionaldata: 'additionaldata'
};

exports.Prisma.Mdl_auth_oidc_tokenScalarFieldEnum = {
  id: 'id',
  oidcuniqid: 'oidcuniqid',
  username: 'username',
  userid: 'userid',
  oidcusername: 'oidcusername',
  scope: 'scope',
  tokenresource: 'tokenresource',
  authcode: 'authcode',
  token: 'token',
  expiry: 'expiry',
  refreshtoken: 'refreshtoken',
  idtoken: 'idtoken',
  sid: 'sid'
};

exports.Prisma.Mdl_backup_controllersScalarFieldEnum = {
  id: 'id',
  backupid: 'backupid',
  operation: 'operation',
  type: 'type',
  itemid: 'itemid',
  format: 'format',
  interactive: 'interactive',
  purpose: 'purpose',
  userid: 'userid',
  status: 'status',
  execution: 'execution',
  executiontime: 'executiontime',
  checksum: 'checksum',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  progress: 'progress',
  controller: 'controller'
};

exports.Prisma.Mdl_backup_coursesScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  laststarttime: 'laststarttime',
  lastendtime: 'lastendtime',
  laststatus: 'laststatus',
  nextstarttime: 'nextstarttime'
};

exports.Prisma.Mdl_backup_logsScalarFieldEnum = {
  id: 'id',
  backupid: 'backupid',
  loglevel: 'loglevel',
  message: 'message',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_badgeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usercreated: 'usercreated',
  usermodified: 'usermodified',
  issuername: 'issuername',
  issuerurl: 'issuerurl',
  issuercontact: 'issuercontact',
  expiredate: 'expiredate',
  expireperiod: 'expireperiod',
  type: 'type',
  courseid: 'courseid',
  message: 'message',
  messagesubject: 'messagesubject',
  attachment: 'attachment',
  notification: 'notification',
  status: 'status',
  nextcron: 'nextcron',
  version: 'version',
  language: 'language',
  imageauthorname: 'imageauthorname',
  imageauthoremail: 'imageauthoremail',
  imageauthorurl: 'imageauthorurl',
  imagecaption: 'imagecaption'
};

exports.Prisma.Mdl_badge_alignmentScalarFieldEnum = {
  id: 'id',
  badgeid: 'badgeid',
  targetname: 'targetname',
  targeturl: 'targeturl',
  targetdescription: 'targetdescription',
  targetframework: 'targetframework',
  targetcode: 'targetcode'
};

exports.Prisma.Mdl_badge_backpackScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  email: 'email',
  backpackuid: 'backpackuid',
  autosync: 'autosync',
  password: 'password',
  externalbackpackid: 'externalbackpackid'
};

exports.Prisma.Mdl_badge_backpack_oauth2ScalarFieldEnum = {
  id: 'id',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  userid: 'userid',
  issuerid: 'issuerid',
  externalbackpackid: 'externalbackpackid',
  token: 'token',
  refreshtoken: 'refreshtoken',
  expires: 'expires',
  scope: 'scope'
};

exports.Prisma.Mdl_badge_criteriaScalarFieldEnum = {
  id: 'id',
  badgeid: 'badgeid',
  criteriatype: 'criteriatype',
  method: 'method',
  description: 'description',
  descriptionformat: 'descriptionformat'
};

exports.Prisma.Mdl_badge_criteria_metScalarFieldEnum = {
  id: 'id',
  issuedid: 'issuedid',
  critid: 'critid',
  userid: 'userid',
  datemet: 'datemet'
};

exports.Prisma.Mdl_badge_criteria_paramScalarFieldEnum = {
  id: 'id',
  critid: 'critid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_badge_endorsementScalarFieldEnum = {
  id: 'id',
  badgeid: 'badgeid',
  issuername: 'issuername',
  issuerurl: 'issuerurl',
  issueremail: 'issueremail',
  claimid: 'claimid',
  claimcomment: 'claimcomment',
  dateissued: 'dateissued'
};

exports.Prisma.Mdl_badge_externalScalarFieldEnum = {
  id: 'id',
  backpackid: 'backpackid',
  collectionid: 'collectionid',
  entityid: 'entityid',
  assertion: 'assertion'
};

exports.Prisma.Mdl_badge_external_backpackScalarFieldEnum = {
  id: 'id',
  backpackapiurl: 'backpackapiurl',
  backpackweburl: 'backpackweburl',
  apiversion: 'apiversion',
  sortorder: 'sortorder',
  oauth2_issuerid: 'oauth2_issuerid'
};

exports.Prisma.Mdl_badge_external_identifierScalarFieldEnum = {
  id: 'id',
  sitebackpackid: 'sitebackpackid',
  internalid: 'internalid',
  externalid: 'externalid',
  type: 'type'
};

exports.Prisma.Mdl_badge_issuedScalarFieldEnum = {
  id: 'id',
  badgeid: 'badgeid',
  userid: 'userid',
  uniquehash: 'uniquehash',
  dateissued: 'dateissued',
  dateexpire: 'dateexpire',
  visible: 'visible',
  issuernotified: 'issuernotified'
};

exports.Prisma.Mdl_badge_manual_awardScalarFieldEnum = {
  id: 'id',
  badgeid: 'badgeid',
  recipientid: 'recipientid',
  issuerid: 'issuerid',
  issuerrole: 'issuerrole',
  datemet: 'datemet'
};

exports.Prisma.Mdl_badge_relatedScalarFieldEnum = {
  id: 'id',
  badgeid: 'badgeid',
  relatedbadgeid: 'relatedbadgeid'
};

exports.Prisma.Mdl_bigbluebuttonbnScalarFieldEnum = {
  id: 'id',
  type: 'type',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  meetingid: 'meetingid',
  moderatorpass: 'moderatorpass',
  viewerpass: 'viewerpass',
  wait: 'wait',
  record: 'record',
  recordallfromstart: 'recordallfromstart',
  recordhidebutton: 'recordhidebutton',
  welcome: 'welcome',
  voicebridge: 'voicebridge',
  openingtime: 'openingtime',
  closingtime: 'closingtime',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  presentation: 'presentation',
  participants: 'participants',
  userlimit: 'userlimit',
  recordings_html: 'recordings_html',
  recordings_deleted: 'recordings_deleted',
  recordings_imported: 'recordings_imported',
  recordings_preview: 'recordings_preview',
  clienttype: 'clienttype',
  muteonstart: 'muteonstart',
  disablecam: 'disablecam',
  disablemic: 'disablemic',
  disableprivatechat: 'disableprivatechat',
  disablepublicchat: 'disablepublicchat',
  disablenote: 'disablenote',
  hideuserlist: 'hideuserlist',
  lockedlayout: 'lockedlayout',
  completionattendance: 'completionattendance',
  completionengagementchats: 'completionengagementchats',
  completionengagementtalks: 'completionengagementtalks',
  completionengagementraisehand: 'completionengagementraisehand',
  completionengagementpollvotes: 'completionengagementpollvotes',
  completionengagementemojis: 'completionengagementemojis',
  guestallowed: 'guestallowed',
  mustapproveuser: 'mustapproveuser',
  guestlinkuid: 'guestlinkuid',
  guestpassword: 'guestpassword'
};

exports.Prisma.Mdl_bigbluebuttonbn_logsScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  bigbluebuttonbnid: 'bigbluebuttonbnid',
  userid: 'userid',
  timecreated: 'timecreated',
  meetingid: 'meetingid',
  log: 'log',
  meta: 'meta'
};

exports.Prisma.Mdl_bigbluebuttonbn_recordingsScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  bigbluebuttonbnid: 'bigbluebuttonbnid',
  groupid: 'groupid',
  recordingid: 'recordingid',
  headless: 'headless',
  imported: 'imported',
  status: 'status',
  importeddata: 'importeddata',
  timecreated: 'timecreated',
  usermodified: 'usermodified',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_blockScalarFieldEnum = {
  id: 'id',
  name: 'name',
  cron: 'cron',
  lastcron: 'lastcron',
  visible: 'visible'
};

exports.Prisma.Mdl_block_instancesScalarFieldEnum = {
  id: 'id',
  blockname: 'blockname',
  parentcontextid: 'parentcontextid',
  showinsubcontexts: 'showinsubcontexts',
  requiredbytheme: 'requiredbytheme',
  pagetypepattern: 'pagetypepattern',
  subpagepattern: 'subpagepattern',
  defaultregion: 'defaultregion',
  defaultweight: 'defaultweight',
  configdata: 'configdata',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_block_positionsScalarFieldEnum = {
  id: 'id',
  blockinstanceid: 'blockinstanceid',
  contextid: 'contextid',
  pagetype: 'pagetype',
  subpage: 'subpage',
  visible: 'visible',
  region: 'region',
  weight: 'weight'
};

exports.Prisma.Mdl_block_recent_activityScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  cmid: 'cmid',
  timecreated: 'timecreated',
  userid: 'userid',
  action: 'action',
  modname: 'modname'
};

exports.Prisma.Mdl_block_recentlyaccesseditemsScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  cmid: 'cmid',
  userid: 'userid',
  timeaccess: 'timeaccess'
};

exports.Prisma.Mdl_block_rss_clientScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  title: 'title',
  preferredtitle: 'preferredtitle',
  description: 'description',
  shared: 'shared',
  url: 'url',
  skiptime: 'skiptime',
  skipuntil: 'skipuntil'
};

exports.Prisma.Mdl_block_xpScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  userid: 'userid',
  xp: 'xp',
  lvl: 'lvl'
};

exports.Prisma.Mdl_block_xp_configScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  enabled: 'enabled',
  levels: 'levels',
  lastlogpurge: 'lastlogpurge',
  enablecheatguard: 'enablecheatguard',
  enableladder: 'enableladder',
  enableinfos: 'enableinfos',
  levelsdata: 'levelsdata',
  enablelevelupnotif: 'enablelevelupnotif',
  enablecustomlevelbadges: 'enablecustomlevelbadges',
  maxactionspertime: 'maxactionspertime',
  timeformaxactions: 'timeformaxactions',
  timebetweensameactions: 'timebetweensameactions',
  identitymode: 'identitymode',
  rankmode: 'rankmode',
  neighbours: 'neighbours',
  defaultfilters: 'defaultfilters',
  laddercols: 'laddercols',
  instructions: 'instructions',
  instructions_format: 'instructions_format',
  blocktitle: 'blocktitle',
  blockdescription: 'blockdescription',
  blockrecentactivity: 'blockrecentactivity',
  blockrankingsnapshot: 'blockrankingsnapshot'
};

exports.Prisma.Mdl_block_xp_filtersScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  category: 'category',
  ruledata: 'ruledata',
  points: 'points',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_block_xp_logScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  userid: 'userid',
  eventname: 'eventname',
  xp: 'xp',
  time: 'time'
};

exports.Prisma.Mdl_blog_associationScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  blogid: 'blogid'
};

exports.Prisma.Mdl_blog_externalScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  name: 'name',
  description: 'description',
  url: 'url',
  filtertags: 'filtertags',
  failedlastsync: 'failedlastsync',
  timemodified: 'timemodified',
  timefetched: 'timefetched'
};

exports.Prisma.Mdl_bookScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  numbering: 'numbering',
  navstyle: 'navstyle',
  customtitles: 'customtitles',
  revision: 'revision',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_book_chaptersScalarFieldEnum = {
  id: 'id',
  bookid: 'bookid',
  pagenum: 'pagenum',
  subchapter: 'subchapter',
  title: 'title',
  content: 'content',
  contentformat: 'contentformat',
  hidden: 'hidden',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  importsrc: 'importsrc'
};

exports.Prisma.Mdl_cache_filtersScalarFieldEnum = {
  id: 'id',
  filter: 'filter',
  version: 'version',
  md5key: 'md5key',
  rawtext: 'rawtext',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_cache_flagsScalarFieldEnum = {
  id: 'id',
  flagtype: 'flagtype',
  name: 'name',
  timemodified: 'timemodified',
  value: 'value',
  expiry: 'expiry'
};

exports.Prisma.Mdl_capabilitiesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  captype: 'captype',
  contextlevel: 'contextlevel',
  component: 'component',
  riskbitmask: 'riskbitmask'
};

exports.Prisma.Mdl_chatScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  keepdays: 'keepdays',
  studentlogs: 'studentlogs',
  chattime: 'chattime',
  schedule: 'schedule',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_chat_messagesScalarFieldEnum = {
  id: 'id',
  chatid: 'chatid',
  userid: 'userid',
  groupid: 'groupid',
  issystem: 'issystem',
  message: 'message',
  timestamp: 'timestamp'
};

exports.Prisma.Mdl_chat_messages_currentScalarFieldEnum = {
  id: 'id',
  chatid: 'chatid',
  userid: 'userid',
  groupid: 'groupid',
  issystem: 'issystem',
  message: 'message',
  timestamp: 'timestamp'
};

exports.Prisma.Mdl_chat_usersScalarFieldEnum = {
  id: 'id',
  chatid: 'chatid',
  userid: 'userid',
  groupid: 'groupid',
  version: 'version',
  ip: 'ip',
  firstping: 'firstping',
  lastping: 'lastping',
  lastmessageping: 'lastmessageping',
  sid: 'sid',
  course: 'course',
  lang: 'lang'
};

exports.Prisma.Mdl_choiceScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  publish: 'publish',
  showresults: 'showresults',
  display: 'display',
  allowupdate: 'allowupdate',
  allowmultiple: 'allowmultiple',
  showunanswered: 'showunanswered',
  includeinactive: 'includeinactive',
  limitanswers: 'limitanswers',
  timeopen: 'timeopen',
  timeclose: 'timeclose',
  showpreview: 'showpreview',
  timemodified: 'timemodified',
  completionsubmit: 'completionsubmit',
  showavailable: 'showavailable'
};

exports.Prisma.Mdl_choice_answersScalarFieldEnum = {
  id: 'id',
  choiceid: 'choiceid',
  userid: 'userid',
  optionid: 'optionid',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_choice_optionsScalarFieldEnum = {
  id: 'id',
  choiceid: 'choiceid',
  text: 'text',
  maxanswers: 'maxanswers',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_cohortScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  name: 'name',
  idnumber: 'idnumber',
  description: 'description',
  descriptionformat: 'descriptionformat',
  visible: 'visible',
  component: 'component',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  theme: 'theme'
};

exports.Prisma.Mdl_cohort_membersScalarFieldEnum = {
  id: 'id',
  cohortid: 'cohortid',
  userid: 'userid',
  timeadded: 'timeadded'
};

exports.Prisma.Mdl_commentsScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  component: 'component',
  commentarea: 'commentarea',
  itemid: 'itemid',
  content: 'content',
  format: 'format',
  userid: 'userid',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_competencyScalarFieldEnum = {
  id: 'id',
  shortname: 'shortname',
  description: 'description',
  descriptionformat: 'descriptionformat',
  idnumber: 'idnumber',
  competencyframeworkid: 'competencyframeworkid',
  parentid: 'parentid',
  path: 'path',
  sortorder: 'sortorder',
  ruletype: 'ruletype',
  ruleoutcome: 'ruleoutcome',
  ruleconfig: 'ruleconfig',
  scaleid: 'scaleid',
  scaleconfiguration: 'scaleconfiguration',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_coursecompScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  competencyid: 'competencyid',
  ruleoutcome: 'ruleoutcome',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_competency_coursecompsettingScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  pushratingstouserplans: 'pushratingstouserplans',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_evidenceScalarFieldEnum = {
  id: 'id',
  usercompetencyid: 'usercompetencyid',
  contextid: 'contextid',
  action: 'action',
  actionuserid: 'actionuserid',
  descidentifier: 'descidentifier',
  desccomponent: 'desccomponent',
  desca: 'desca',
  url: 'url',
  grade: 'grade',
  note: 'note',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_frameworkScalarFieldEnum = {
  id: 'id',
  shortname: 'shortname',
  contextid: 'contextid',
  idnumber: 'idnumber',
  description: 'description',
  descriptionformat: 'descriptionformat',
  scaleid: 'scaleid',
  scaleconfiguration: 'scaleconfiguration',
  visible: 'visible',
  taxonomies: 'taxonomies',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_modulecompScalarFieldEnum = {
  id: 'id',
  cmid: 'cmid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified',
  sortorder: 'sortorder',
  competencyid: 'competencyid',
  ruleoutcome: 'ruleoutcome',
  overridegrade: 'overridegrade'
};

exports.Prisma.Mdl_competency_planScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  descriptionformat: 'descriptionformat',
  userid: 'userid',
  templateid: 'templateid',
  origtemplateid: 'origtemplateid',
  status: 'status',
  duedate: 'duedate',
  reviewerid: 'reviewerid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_plancompScalarFieldEnum = {
  id: 'id',
  planid: 'planid',
  competencyid: 'competencyid',
  sortorder: 'sortorder',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_relatedcompScalarFieldEnum = {
  id: 'id',
  competencyid: 'competencyid',
  relatedcompetencyid: 'relatedcompetencyid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_templateScalarFieldEnum = {
  id: 'id',
  shortname: 'shortname',
  contextid: 'contextid',
  description: 'description',
  descriptionformat: 'descriptionformat',
  visible: 'visible',
  duedate: 'duedate',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_templatecohortScalarFieldEnum = {
  id: 'id',
  templateid: 'templateid',
  cohortid: 'cohortid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_templatecompScalarFieldEnum = {
  id: 'id',
  templateid: 'templateid',
  competencyid: 'competencyid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_competency_usercompScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  competencyid: 'competencyid',
  status: 'status',
  reviewerid: 'reviewerid',
  proficiency: 'proficiency',
  grade: 'grade',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_usercompcourseScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  courseid: 'courseid',
  competencyid: 'competencyid',
  proficiency: 'proficiency',
  grade: 'grade',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_usercompplanScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  competencyid: 'competencyid',
  planid: 'planid',
  proficiency: 'proficiency',
  grade: 'grade',
  sortorder: 'sortorder',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_userevidenceScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  name: 'name',
  description: 'description',
  descriptionformat: 'descriptionformat',
  url: 'url',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_competency_userevidencecompScalarFieldEnum = {
  id: 'id',
  userevidenceid: 'userevidenceid',
  competencyid: 'competencyid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_configScalarFieldEnum = {
  id: 'id',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_config_logScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  timemodified: 'timemodified',
  plugin: 'plugin',
  name: 'name',
  value: 'value',
  oldvalue: 'oldvalue'
};

exports.Prisma.Mdl_config_pluginsScalarFieldEnum = {
  id: 'id',
  plugin: 'plugin',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_contentbank_contentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  contenttype: 'contenttype',
  contextid: 'contextid',
  visibility: 'visibility',
  instanceid: 'instanceid',
  configdata: 'configdata',
  usercreated: 'usercreated',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_contextScalarFieldEnum = {
  id: 'id',
  contextlevel: 'contextlevel',
  instanceid: 'instanceid',
  path: 'path',
  depth: 'depth',
  locked: 'locked'
};

exports.Prisma.Mdl_context_tempScalarFieldEnum = {
  id: 'id',
  path: 'path',
  depth: 'depth',
  locked: 'locked'
};

exports.Prisma.Mdl_courseScalarFieldEnum = {
  id: 'id',
  category: 'category',
  sortorder: 'sortorder',
  fullname: 'fullname',
  shortname: 'shortname',
  idnumber: 'idnumber',
  summary: 'summary',
  summaryformat: 'summaryformat',
  format: 'format',
  showgrades: 'showgrades',
  newsitems: 'newsitems',
  startdate: 'startdate',
  enddate: 'enddate',
  relativedatesmode: 'relativedatesmode',
  marker: 'marker',
  maxbytes: 'maxbytes',
  legacyfiles: 'legacyfiles',
  showreports: 'showreports',
  visible: 'visible',
  visibleold: 'visibleold',
  downloadcontent: 'downloadcontent',
  groupmode: 'groupmode',
  groupmodeforce: 'groupmodeforce',
  defaultgroupingid: 'defaultgroupingid',
  lang: 'lang',
  calendartype: 'calendartype',
  theme: 'theme',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  requested: 'requested',
  enablecompletion: 'enablecompletion',
  completionnotify: 'completionnotify',
  cacherev: 'cacherev',
  originalcourseid: 'originalcourseid',
  showactivitydates: 'showactivitydates',
  showcompletionconditions: 'showcompletionconditions'
};

exports.Prisma.Mdl_course_categoriesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  idnumber: 'idnumber',
  description: 'description',
  descriptionformat: 'descriptionformat',
  parent: 'parent',
  sortorder: 'sortorder',
  coursecount: 'coursecount',
  visible: 'visible',
  visibleold: 'visibleold',
  timemodified: 'timemodified',
  depth: 'depth',
  path: 'path',
  theme: 'theme'
};

exports.Prisma.Mdl_course_completion_aggr_methdScalarFieldEnum = {
  id: 'id',
  course: 'course',
  criteriatype: 'criteriatype',
  method: 'method',
  value: 'value'
};

exports.Prisma.Mdl_course_completion_crit_complScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  course: 'course',
  criteriaid: 'criteriaid',
  gradefinal: 'gradefinal',
  unenroled: 'unenroled',
  timecompleted: 'timecompleted'
};

exports.Prisma.Mdl_course_completion_criteriaScalarFieldEnum = {
  id: 'id',
  course: 'course',
  criteriatype: 'criteriatype',
  module: 'module',
  moduleinstance: 'moduleinstance',
  courseinstance: 'courseinstance',
  enrolperiod: 'enrolperiod',
  timeend: 'timeend',
  gradepass: 'gradepass',
  role: 'role'
};

exports.Prisma.Mdl_course_completion_defaultsScalarFieldEnum = {
  id: 'id',
  course: 'course',
  module: 'module',
  completion: 'completion',
  completionview: 'completionview',
  completionusegrade: 'completionusegrade',
  completionpassgrade: 'completionpassgrade',
  completionexpected: 'completionexpected',
  customrules: 'customrules'
};

exports.Prisma.Mdl_course_completionsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  course: 'course',
  timeenrolled: 'timeenrolled',
  timestarted: 'timestarted',
  timecompleted: 'timecompleted',
  reaggregate: 'reaggregate'
};

exports.Prisma.Mdl_course_format_optionsScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  format: 'format',
  sectionid: 'sectionid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_course_modulesScalarFieldEnum = {
  id: 'id',
  course: 'course',
  module: 'module',
  instance: 'instance',
  section: 'section',
  idnumber: 'idnumber',
  added: 'added',
  score: 'score',
  indent: 'indent',
  visible: 'visible',
  visibleoncoursepage: 'visibleoncoursepage',
  visibleold: 'visibleold',
  groupmode: 'groupmode',
  groupingid: 'groupingid',
  completion: 'completion',
  completiongradeitemnumber: 'completiongradeitemnumber',
  completionview: 'completionview',
  completionexpected: 'completionexpected',
  completionpassgrade: 'completionpassgrade',
  showdescription: 'showdescription',
  availability: 'availability',
  deletioninprogress: 'deletioninprogress',
  downloadcontent: 'downloadcontent',
  lang: 'lang'
};

exports.Prisma.Mdl_course_modules_completionScalarFieldEnum = {
  id: 'id',
  coursemoduleid: 'coursemoduleid',
  userid: 'userid',
  completionstate: 'completionstate',
  overrideby: 'overrideby',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_course_modules_viewedScalarFieldEnum = {
  id: 'id',
  coursemoduleid: 'coursemoduleid',
  userid: 'userid',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_course_publishedScalarFieldEnum = {
  id: 'id',
  huburl: 'huburl',
  courseid: 'courseid',
  timepublished: 'timepublished',
  enrollable: 'enrollable',
  hubcourseid: 'hubcourseid',
  status: 'status',
  timechecked: 'timechecked'
};

exports.Prisma.Mdl_course_requestScalarFieldEnum = {
  id: 'id',
  fullname: 'fullname',
  shortname: 'shortname',
  summary: 'summary',
  summaryformat: 'summaryformat',
  category: 'category',
  reason: 'reason',
  requester: 'requester',
  password: 'password'
};

exports.Prisma.Mdl_course_sectionsScalarFieldEnum = {
  id: 'id',
  course: 'course',
  section: 'section',
  name: 'name',
  summary: 'summary',
  summaryformat: 'summaryformat',
  sequence: 'sequence',
  visible: 'visible',
  availability: 'availability',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_customcertScalarFieldEnum = {
  id: 'id',
  course: 'course',
  templateid: 'templateid',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  requiredtime: 'requiredtime',
  verifyany: 'verifyany',
  deliveryoption: 'deliveryoption',
  emailstudents: 'emailstudents',
  emailteachers: 'emailteachers',
  emailothers: 'emailothers',
  protection: 'protection',
  language: 'language',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_customcert_elementsScalarFieldEnum = {
  id: 'id',
  pageid: 'pageid',
  name: 'name',
  element: 'element',
  data: 'data',
  font: 'font',
  fontsize: 'fontsize',
  colour: 'colour',
  posx: 'posx',
  posy: 'posy',
  width: 'width',
  refpoint: 'refpoint',
  alignment: 'alignment',
  sequence: 'sequence',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_customcert_issuesScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  customcertid: 'customcertid',
  code: 'code',
  emailed: 'emailed',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_customcert_pagesScalarFieldEnum = {
  id: 'id',
  templateid: 'templateid',
  width: 'width',
  height: 'height',
  leftmargin: 'leftmargin',
  rightmargin: 'rightmargin',
  sequence: 'sequence',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_customcert_templatesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  contextid: 'contextid',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_customfield_categoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  descriptionformat: 'descriptionformat',
  sortorder: 'sortorder',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  component: 'component',
  area: 'area',
  itemid: 'itemid',
  contextid: 'contextid'
};

exports.Prisma.Mdl_customfield_dataScalarFieldEnum = {
  id: 'id',
  fieldid: 'fieldid',
  instanceid: 'instanceid',
  intvalue: 'intvalue',
  decvalue: 'decvalue',
  shortcharvalue: 'shortcharvalue',
  charvalue: 'charvalue',
  value: 'value',
  valueformat: 'valueformat',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  contextid: 'contextid'
};

exports.Prisma.Mdl_customfield_fieldScalarFieldEnum = {
  id: 'id',
  shortname: 'shortname',
  name: 'name',
  type: 'type',
  description: 'description',
  descriptionformat: 'descriptionformat',
  sortorder: 'sortorder',
  categoryid: 'categoryid',
  configdata: 'configdata',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_dataScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  comments: 'comments',
  timeavailablefrom: 'timeavailablefrom',
  timeavailableto: 'timeavailableto',
  timeviewfrom: 'timeviewfrom',
  timeviewto: 'timeviewto',
  requiredentries: 'requiredentries',
  requiredentriestoview: 'requiredentriestoview',
  maxentries: 'maxentries',
  rssarticles: 'rssarticles',
  singletemplate: 'singletemplate',
  listtemplate: 'listtemplate',
  listtemplateheader: 'listtemplateheader',
  listtemplatefooter: 'listtemplatefooter',
  addtemplate: 'addtemplate',
  rsstemplate: 'rsstemplate',
  rsstitletemplate: 'rsstitletemplate',
  csstemplate: 'csstemplate',
  jstemplate: 'jstemplate',
  asearchtemplate: 'asearchtemplate',
  approval: 'approval',
  manageapproved: 'manageapproved',
  scale: 'scale',
  assessed: 'assessed',
  assesstimestart: 'assesstimestart',
  assesstimefinish: 'assesstimefinish',
  defaultsort: 'defaultsort',
  defaultsortdir: 'defaultsortdir',
  editany: 'editany',
  notification: 'notification',
  timemodified: 'timemodified',
  config: 'config',
  completionentries: 'completionentries'
};

exports.Prisma.Mdl_data_contentScalarFieldEnum = {
  id: 'id',
  fieldid: 'fieldid',
  recordid: 'recordid',
  content: 'content',
  content1: 'content1',
  content2: 'content2',
  content3: 'content3',
  content4: 'content4'
};

exports.Prisma.Mdl_data_fieldsScalarFieldEnum = {
  id: 'id',
  dataid: 'dataid',
  type: 'type',
  name: 'name',
  description: 'description',
  required: 'required',
  param1: 'param1',
  param2: 'param2',
  param3: 'param3',
  param4: 'param4',
  param5: 'param5',
  param6: 'param6',
  param7: 'param7',
  param8: 'param8',
  param9: 'param9',
  param10: 'param10'
};

exports.Prisma.Mdl_data_recordsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  groupid: 'groupid',
  dataid: 'dataid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  approved: 'approved'
};

exports.Prisma.Mdl_editor_atto_autosaveScalarFieldEnum = {
  id: 'id',
  elementid: 'elementid',
  contextid: 'contextid',
  pagehash: 'pagehash',
  userid: 'userid',
  drafttext: 'drafttext',
  draftid: 'draftid',
  pageinstance: 'pageinstance',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_enrolScalarFieldEnum = {
  id: 'id',
  enrol: 'enrol',
  status: 'status',
  courseid: 'courseid',
  sortorder: 'sortorder',
  name: 'name',
  enrolperiod: 'enrolperiod',
  enrolstartdate: 'enrolstartdate',
  enrolenddate: 'enrolenddate',
  expirynotify: 'expirynotify',
  expirythreshold: 'expirythreshold',
  notifyall: 'notifyall',
  password: 'password',
  cost: 'cost',
  currency: 'currency',
  roleid: 'roleid',
  customint1: 'customint1',
  customint2: 'customint2',
  customint3: 'customint3',
  customint4: 'customint4',
  customint5: 'customint5',
  customint6: 'customint6',
  customint7: 'customint7',
  customint8: 'customint8',
  customchar1: 'customchar1',
  customchar2: 'customchar2',
  customchar3: 'customchar3',
  customdec1: 'customdec1',
  customdec2: 'customdec2',
  customtext1: 'customtext1',
  customtext2: 'customtext2',
  customtext3: 'customtext3',
  customtext4: 'customtext4',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_enrol_flatfileScalarFieldEnum = {
  id: 'id',
  action: 'action',
  roleid: 'roleid',
  userid: 'userid',
  courseid: 'courseid',
  timestart: 'timestart',
  timeend: 'timeend',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_enrol_lti_app_registrationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  platformid: 'platformid',
  clientid: 'clientid',
  uniqueid: 'uniqueid',
  platformclienthash: 'platformclienthash',
  platformuniqueidhash: 'platformuniqueidhash',
  authenticationrequesturl: 'authenticationrequesturl',
  jwksurl: 'jwksurl',
  accesstokenurl: 'accesstokenurl',
  status: 'status',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_enrol_lti_contextScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  ltideploymentid: 'ltideploymentid',
  type: 'type',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_enrol_lti_deploymentScalarFieldEnum = {
  id: 'id',
  name: 'name',
  deploymentid: 'deploymentid',
  platformid: 'platformid',
  legacyconsumerkey: 'legacyconsumerkey',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_enrol_lti_lti2_consumerScalarFieldEnum = {
  id: 'id',
  name: 'name',
  consumerkey256: 'consumerkey256',
  consumerkey: 'consumerkey',
  secret: 'secret',
  ltiversion: 'ltiversion',
  consumername: 'consumername',
  consumerversion: 'consumerversion',
  consumerguid: 'consumerguid',
  profile: 'profile',
  toolproxy: 'toolproxy',
  settings: 'settings',
  protected: 'protected',
  enabled: 'enabled',
  enablefrom: 'enablefrom',
  enableuntil: 'enableuntil',
  lastaccess: 'lastaccess',
  created: 'created',
  updated: 'updated'
};

exports.Prisma.Mdl_enrol_lti_lti2_contextScalarFieldEnum = {
  id: 'id',
  consumerid: 'consumerid',
  lticontextkey: 'lticontextkey',
  type: 'type',
  settings: 'settings',
  created: 'created',
  updated: 'updated'
};

exports.Prisma.Mdl_enrol_lti_lti2_nonceScalarFieldEnum = {
  id: 'id',
  consumerid: 'consumerid',
  value: 'value',
  expires: 'expires'
};

exports.Prisma.Mdl_enrol_lti_lti2_resource_linkScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  consumerid: 'consumerid',
  ltiresourcelinkkey: 'ltiresourcelinkkey',
  settings: 'settings',
  primaryresourcelinkid: 'primaryresourcelinkid',
  shareapproved: 'shareapproved',
  created: 'created',
  updated: 'updated'
};

exports.Prisma.Mdl_enrol_lti_lti2_share_keyScalarFieldEnum = {
  id: 'id',
  sharekey: 'sharekey',
  resourcelinkid: 'resourcelinkid',
  autoapprove: 'autoapprove',
  expires: 'expires'
};

exports.Prisma.Mdl_enrol_lti_lti2_tool_proxyScalarFieldEnum = {
  id: 'id',
  toolproxykey: 'toolproxykey',
  consumerid: 'consumerid',
  toolproxy: 'toolproxy',
  created: 'created',
  updated: 'updated'
};

exports.Prisma.Mdl_enrol_lti_lti2_user_resultScalarFieldEnum = {
  id: 'id',
  resourcelinkid: 'resourcelinkid',
  ltiuserkey: 'ltiuserkey',
  ltiresultsourcedid: 'ltiresultsourcedid',
  created: 'created',
  updated: 'updated'
};

exports.Prisma.Mdl_enrol_lti_resource_linkScalarFieldEnum = {
  id: 'id',
  resourcelinkid: 'resourcelinkid',
  ltideploymentid: 'ltideploymentid',
  resourceid: 'resourceid',
  lticontextid: 'lticontextid',
  lineitemsservice: 'lineitemsservice',
  lineitemservice: 'lineitemservice',
  lineitemscope: 'lineitemscope',
  resultscope: 'resultscope',
  scorescope: 'scorescope',
  contextmembershipsurl: 'contextmembershipsurl',
  nrpsserviceversions: 'nrpsserviceversions',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_enrol_lti_tool_consumer_mapScalarFieldEnum = {
  id: 'id',
  toolid: 'toolid',
  consumerid: 'consumerid'
};

exports.Prisma.Mdl_enrol_lti_toolsScalarFieldEnum = {
  id: 'id',
  enrolid: 'enrolid',
  contextid: 'contextid',
  ltiversion: 'ltiversion',
  institution: 'institution',
  lang: 'lang',
  timezone: 'timezone',
  maxenrolled: 'maxenrolled',
  maildisplay: 'maildisplay',
  city: 'city',
  country: 'country',
  gradesync: 'gradesync',
  gradesynccompletion: 'gradesynccompletion',
  membersync: 'membersync',
  membersyncmode: 'membersyncmode',
  roleinstructor: 'roleinstructor',
  rolelearner: 'rolelearner',
  secret: 'secret',
  uuid: 'uuid',
  provisioningmodelearner: 'provisioningmodelearner',
  provisioningmodeinstructor: 'provisioningmodeinstructor',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_enrol_lti_user_resource_linkScalarFieldEnum = {
  id: 'id',
  ltiuserid: 'ltiuserid',
  resourcelinkid: 'resourcelinkid'
};

exports.Prisma.Mdl_enrol_lti_usersScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  toolid: 'toolid',
  serviceurl: 'serviceurl',
  sourceid: 'sourceid',
  ltideploymentid: 'ltideploymentid',
  consumerkey: 'consumerkey',
  consumersecret: 'consumersecret',
  membershipsurl: 'membershipsurl',
  membershipsid: 'membershipsid',
  lastgrade: 'lastgrade',
  lastaccess: 'lastaccess',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_enrol_paypalScalarFieldEnum = {
  id: 'id',
  business: 'business',
  receiver_email: 'receiver_email',
  receiver_id: 'receiver_id',
  item_name: 'item_name',
  courseid: 'courseid',
  userid: 'userid',
  instanceid: 'instanceid',
  memo: 'memo',
  tax: 'tax',
  option_name1: 'option_name1',
  option_selection1_x: 'option_selection1_x',
  option_name2: 'option_name2',
  option_selection2_x: 'option_selection2_x',
  payment_status: 'payment_status',
  pending_reason: 'pending_reason',
  reason_code: 'reason_code',
  txn_id: 'txn_id',
  parent_txn_id: 'parent_txn_id',
  payment_type: 'payment_type',
  timeupdated: 'timeupdated'
};

exports.Prisma.Mdl_eventScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  format: 'format',
  categoryid: 'categoryid',
  courseid: 'courseid',
  groupid: 'groupid',
  userid: 'userid',
  repeatid: 'repeatid',
  component: 'component',
  modulename: 'modulename',
  instance: 'instance',
  type: 'type',
  eventtype: 'eventtype',
  timestart: 'timestart',
  timeduration: 'timeduration',
  timesort: 'timesort',
  visible: 'visible',
  uuid: 'uuid',
  sequence: 'sequence',
  timemodified: 'timemodified',
  subscriptionid: 'subscriptionid',
  priority: 'priority',
  location: 'location'
};

exports.Prisma.Mdl_event_subscriptionsScalarFieldEnum = {
  id: 'id',
  url: 'url',
  categoryid: 'categoryid',
  courseid: 'courseid',
  groupid: 'groupid',
  userid: 'userid',
  eventtype: 'eventtype',
  pollinterval: 'pollinterval',
  lastupdated: 'lastupdated',
  name: 'name'
};

exports.Prisma.Mdl_events_handlersScalarFieldEnum = {
  id: 'id',
  eventname: 'eventname',
  component: 'component',
  handlerfile: 'handlerfile',
  handlerfunction: 'handlerfunction',
  schedule: 'schedule',
  status: 'status',
  internal: 'internal'
};

exports.Prisma.Mdl_events_queueScalarFieldEnum = {
  id: 'id',
  eventdata: 'eventdata',
  stackdump: 'stackdump',
  userid: 'userid',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_events_queue_handlersScalarFieldEnum = {
  id: 'id',
  queuedeventid: 'queuedeventid',
  handlerid: 'handlerid',
  status: 'status',
  errormessage: 'errormessage',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_external_functionsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  classname: 'classname',
  methodname: 'methodname',
  classpath: 'classpath',
  component: 'component',
  capabilities: 'capabilities',
  services: 'services'
};

exports.Prisma.Mdl_external_servicesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  enabled: 'enabled',
  requiredcapability: 'requiredcapability',
  restrictedusers: 'restrictedusers',
  component: 'component',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  shortname: 'shortname',
  downloadfiles: 'downloadfiles',
  uploadfiles: 'uploadfiles'
};

exports.Prisma.Mdl_external_services_functionsScalarFieldEnum = {
  id: 'id',
  externalserviceid: 'externalserviceid',
  functionname: 'functionname'
};

exports.Prisma.Mdl_external_services_usersScalarFieldEnum = {
  id: 'id',
  externalserviceid: 'externalserviceid',
  userid: 'userid',
  iprestriction: 'iprestriction',
  validuntil: 'validuntil',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_external_tokensScalarFieldEnum = {
  id: 'id',
  token: 'token',
  privatetoken: 'privatetoken',
  tokentype: 'tokentype',
  userid: 'userid',
  externalserviceid: 'externalserviceid',
  sid: 'sid',
  contextid: 'contextid',
  creatorid: 'creatorid',
  iprestriction: 'iprestriction',
  validuntil: 'validuntil',
  timecreated: 'timecreated',
  lastaccess: 'lastaccess'
};

exports.Prisma.Mdl_favouriteScalarFieldEnum = {
  id: 'id',
  component: 'component',
  itemtype: 'itemtype',
  itemid: 'itemid',
  contextid: 'contextid',
  userid: 'userid',
  ordering: 'ordering',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_feedbackScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  anonymous: 'anonymous',
  email_notification: 'email_notification',
  multiple_submit: 'multiple_submit',
  autonumbering: 'autonumbering',
  site_after_submit: 'site_after_submit',
  page_after_submit: 'page_after_submit',
  page_after_submitformat: 'page_after_submitformat',
  publish_stats: 'publish_stats',
  timeopen: 'timeopen',
  timeclose: 'timeclose',
  timemodified: 'timemodified',
  completionsubmit: 'completionsubmit'
};

exports.Prisma.Mdl_feedback_completedScalarFieldEnum = {
  id: 'id',
  feedback: 'feedback',
  userid: 'userid',
  timemodified: 'timemodified',
  random_response: 'random_response',
  anonymous_response: 'anonymous_response',
  courseid: 'courseid'
};

exports.Prisma.Mdl_feedback_completedtmpScalarFieldEnum = {
  id: 'id',
  feedback: 'feedback',
  userid: 'userid',
  guestid: 'guestid',
  timemodified: 'timemodified',
  random_response: 'random_response',
  anonymous_response: 'anonymous_response',
  courseid: 'courseid'
};

exports.Prisma.Mdl_feedback_itemScalarFieldEnum = {
  id: 'id',
  feedback: 'feedback',
  template: 'template',
  name: 'name',
  label: 'label',
  presentation: 'presentation',
  typ: 'typ',
  hasvalue: 'hasvalue',
  position: 'position',
  required: 'required',
  dependitem: 'dependitem',
  dependvalue: 'dependvalue',
  options: 'options'
};

exports.Prisma.Mdl_feedback_sitecourse_mapScalarFieldEnum = {
  id: 'id',
  feedbackid: 'feedbackid',
  courseid: 'courseid'
};

exports.Prisma.Mdl_feedback_templateScalarFieldEnum = {
  id: 'id',
  course: 'course',
  ispublic: 'ispublic',
  name: 'name'
};

exports.Prisma.Mdl_feedback_valueScalarFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  item: 'item',
  completed: 'completed',
  tmp_completed: 'tmp_completed',
  value: 'value'
};

exports.Prisma.Mdl_feedback_valuetmpScalarFieldEnum = {
  id: 'id',
  course_id: 'course_id',
  item: 'item',
  completed: 'completed',
  tmp_completed: 'tmp_completed',
  value: 'value'
};

exports.Prisma.Mdl_file_conversionScalarFieldEnum = {
  id: 'id',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  sourcefileid: 'sourcefileid',
  targetformat: 'targetformat',
  status: 'status',
  statusmessage: 'statusmessage',
  converter: 'converter',
  destfileid: 'destfileid',
  data: 'data'
};

exports.Prisma.Mdl_filesScalarFieldEnum = {
  id: 'id',
  contenthash: 'contenthash',
  pathnamehash: 'pathnamehash',
  contextid: 'contextid',
  component: 'component',
  filearea: 'filearea',
  itemid: 'itemid',
  filepath: 'filepath',
  filename: 'filename',
  userid: 'userid',
  filesize: 'filesize',
  mimetype: 'mimetype',
  status: 'status',
  source: 'source',
  author: 'author',
  license: 'license',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  sortorder: 'sortorder',
  referencefileid: 'referencefileid'
};

exports.Prisma.Mdl_files_referenceScalarFieldEnum = {
  id: 'id',
  repositoryid: 'repositoryid',
  lastsync: 'lastsync',
  reference: 'reference',
  referencehash: 'referencehash'
};

exports.Prisma.Mdl_filter_activeScalarFieldEnum = {
  id: 'id',
  filter: 'filter',
  contextid: 'contextid',
  active: 'active',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_filter_configScalarFieldEnum = {
  id: 'id',
  filter: 'filter',
  contextid: 'contextid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_folderScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  revision: 'revision',
  timemodified: 'timemodified',
  display: 'display',
  showexpanded: 'showexpanded',
  showdownloadfolder: 'showdownloadfolder',
  forcedownload: 'forcedownload'
};

exports.Prisma.Mdl_forumScalarFieldEnum = {
  id: 'id',
  course: 'course',
  type: 'type',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  duedate: 'duedate',
  cutoffdate: 'cutoffdate',
  assessed: 'assessed',
  assesstimestart: 'assesstimestart',
  assesstimefinish: 'assesstimefinish',
  scale: 'scale',
  grade_forum: 'grade_forum',
  grade_forum_notify: 'grade_forum_notify',
  maxbytes: 'maxbytes',
  maxattachments: 'maxattachments',
  forcesubscribe: 'forcesubscribe',
  trackingtype: 'trackingtype',
  rsstype: 'rsstype',
  rssarticles: 'rssarticles',
  timemodified: 'timemodified',
  warnafter: 'warnafter',
  blockafter: 'blockafter',
  blockperiod: 'blockperiod',
  completiondiscussions: 'completiondiscussions',
  completionreplies: 'completionreplies',
  completionposts: 'completionposts',
  displaywordcount: 'displaywordcount',
  lockdiscussionafter: 'lockdiscussionafter'
};

exports.Prisma.Mdl_forum_digestsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  forum: 'forum',
  maildigest: 'maildigest'
};

exports.Prisma.Mdl_forum_discussion_subsScalarFieldEnum = {
  id: 'id',
  forum: 'forum',
  userid: 'userid',
  discussion: 'discussion',
  preference: 'preference'
};

exports.Prisma.Mdl_forum_discussionsScalarFieldEnum = {
  id: 'id',
  course: 'course',
  forum: 'forum',
  name: 'name',
  firstpost: 'firstpost',
  userid: 'userid',
  groupid: 'groupid',
  assessed: 'assessed',
  timemodified: 'timemodified',
  usermodified: 'usermodified',
  timestart: 'timestart',
  timeend: 'timeend',
  pinned: 'pinned',
  timelocked: 'timelocked'
};

exports.Prisma.Mdl_forum_gradesScalarFieldEnum = {
  id: 'id',
  forum: 'forum',
  itemnumber: 'itemnumber',
  userid: 'userid',
  grade: 'grade',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_forum_postsScalarFieldEnum = {
  id: 'id',
  discussion: 'discussion',
  parent: 'parent',
  userid: 'userid',
  created: 'created',
  modified: 'modified',
  mailed: 'mailed',
  subject: 'subject',
  message: 'message',
  messageformat: 'messageformat',
  messagetrust: 'messagetrust',
  attachment: 'attachment',
  totalscore: 'totalscore',
  mailnow: 'mailnow',
  deleted: 'deleted',
  privatereplyto: 'privatereplyto',
  wordcount: 'wordcount',
  charcount: 'charcount'
};

exports.Prisma.Mdl_forum_queueScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  discussionid: 'discussionid',
  postid: 'postid',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_forum_readScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  forumid: 'forumid',
  discussionid: 'discussionid',
  postid: 'postid',
  firstread: 'firstread',
  lastread: 'lastread'
};

exports.Prisma.Mdl_forum_subscriptionsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  forum: 'forum'
};

exports.Prisma.Mdl_forum_track_prefsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  forumid: 'forumid'
};

exports.Prisma.Mdl_glossaryScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  allowduplicatedentries: 'allowduplicatedentries',
  displayformat: 'displayformat',
  mainglossary: 'mainglossary',
  showspecial: 'showspecial',
  showalphabet: 'showalphabet',
  showall: 'showall',
  allowcomments: 'allowcomments',
  allowprintview: 'allowprintview',
  usedynalink: 'usedynalink',
  defaultapproval: 'defaultapproval',
  approvaldisplayformat: 'approvaldisplayformat',
  globalglossary: 'globalglossary',
  entbypage: 'entbypage',
  editalways: 'editalways',
  rsstype: 'rsstype',
  rssarticles: 'rssarticles',
  assessed: 'assessed',
  assesstimestart: 'assesstimestart',
  assesstimefinish: 'assesstimefinish',
  scale: 'scale',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  completionentries: 'completionentries'
};

exports.Prisma.Mdl_glossary_aliasScalarFieldEnum = {
  id: 'id',
  entryid: 'entryid',
  alias: 'alias'
};

exports.Prisma.Mdl_glossary_categoriesScalarFieldEnum = {
  id: 'id',
  glossaryid: 'glossaryid',
  name: 'name',
  usedynalink: 'usedynalink'
};

exports.Prisma.Mdl_glossary_entriesScalarFieldEnum = {
  id: 'id',
  glossaryid: 'glossaryid',
  userid: 'userid',
  concept: 'concept',
  definition: 'definition',
  definitionformat: 'definitionformat',
  definitiontrust: 'definitiontrust',
  attachment: 'attachment',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  teacherentry: 'teacherentry',
  sourceglossaryid: 'sourceglossaryid',
  usedynalink: 'usedynalink',
  casesensitive: 'casesensitive',
  fullmatch: 'fullmatch',
  approved: 'approved'
};

exports.Prisma.Mdl_glossary_entries_categoriesScalarFieldEnum = {
  id: 'id',
  categoryid: 'categoryid',
  entryid: 'entryid'
};

exports.Prisma.Mdl_glossary_formatsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  popupformatname: 'popupformatname',
  visible: 'visible',
  showgroup: 'showgroup',
  showtabs: 'showtabs',
  defaultmode: 'defaultmode',
  defaulthook: 'defaulthook',
  sortkey: 'sortkey',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_grade_categoriesScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  parent: 'parent',
  depth: 'depth',
  path: 'path',
  fullname: 'fullname',
  aggregation: 'aggregation',
  keephigh: 'keephigh',
  droplow: 'droplow',
  aggregateonlygraded: 'aggregateonlygraded',
  aggregateoutcomes: 'aggregateoutcomes',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  hidden: 'hidden'
};

exports.Prisma.Mdl_grade_categories_historyScalarFieldEnum = {
  id: 'id',
  action: 'action',
  oldid: 'oldid',
  source: 'source',
  timemodified: 'timemodified',
  loggeduser: 'loggeduser',
  courseid: 'courseid',
  parent: 'parent',
  depth: 'depth',
  path: 'path',
  fullname: 'fullname',
  aggregation: 'aggregation',
  keephigh: 'keephigh',
  droplow: 'droplow',
  aggregateonlygraded: 'aggregateonlygraded',
  aggregateoutcomes: 'aggregateoutcomes',
  aggregatesubcats: 'aggregatesubcats',
  hidden: 'hidden'
};

exports.Prisma.Mdl_grade_gradesScalarFieldEnum = {
  id: 'id',
  itemid: 'itemid',
  userid: 'userid',
  rawgrade: 'rawgrade',
  rawgrademax: 'rawgrademax',
  rawgrademin: 'rawgrademin',
  rawscaleid: 'rawscaleid',
  usermodified: 'usermodified',
  finalgrade: 'finalgrade',
  hidden: 'hidden',
  locked: 'locked',
  locktime: 'locktime',
  exported: 'exported',
  overridden: 'overridden',
  excluded: 'excluded',
  feedback: 'feedback',
  feedbackformat: 'feedbackformat',
  information: 'information',
  informationformat: 'informationformat',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  aggregationstatus: 'aggregationstatus',
  aggregationweight: 'aggregationweight'
};

exports.Prisma.Mdl_grade_grades_historyScalarFieldEnum = {
  id: 'id',
  action: 'action',
  oldid: 'oldid',
  source: 'source',
  timemodified: 'timemodified',
  loggeduser: 'loggeduser',
  itemid: 'itemid',
  userid: 'userid',
  rawgrade: 'rawgrade',
  rawgrademax: 'rawgrademax',
  rawgrademin: 'rawgrademin',
  rawscaleid: 'rawscaleid',
  usermodified: 'usermodified',
  finalgrade: 'finalgrade',
  hidden: 'hidden',
  locked: 'locked',
  locktime: 'locktime',
  exported: 'exported',
  overridden: 'overridden',
  excluded: 'excluded',
  feedback: 'feedback',
  feedbackformat: 'feedbackformat',
  information: 'information',
  informationformat: 'informationformat'
};

exports.Prisma.Mdl_grade_import_newitemScalarFieldEnum = {
  id: 'id',
  itemname: 'itemname',
  importcode: 'importcode',
  importer: 'importer'
};

exports.Prisma.Mdl_grade_import_valuesScalarFieldEnum = {
  id: 'id',
  itemid: 'itemid',
  newgradeitem: 'newgradeitem',
  userid: 'userid',
  finalgrade: 'finalgrade',
  feedback: 'feedback',
  importcode: 'importcode',
  importer: 'importer',
  importonlyfeedback: 'importonlyfeedback'
};

exports.Prisma.Mdl_grade_itemsScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  categoryid: 'categoryid',
  itemname: 'itemname',
  itemtype: 'itemtype',
  itemmodule: 'itemmodule',
  iteminstance: 'iteminstance',
  itemnumber: 'itemnumber',
  iteminfo: 'iteminfo',
  idnumber: 'idnumber',
  calculation: 'calculation',
  gradetype: 'gradetype',
  grademax: 'grademax',
  grademin: 'grademin',
  scaleid: 'scaleid',
  outcomeid: 'outcomeid',
  gradepass: 'gradepass',
  multfactor: 'multfactor',
  plusfactor: 'plusfactor',
  aggregationcoef: 'aggregationcoef',
  aggregationcoef2: 'aggregationcoef2',
  sortorder: 'sortorder',
  display: 'display',
  decimals: 'decimals',
  hidden: 'hidden',
  locked: 'locked',
  locktime: 'locktime',
  needsupdate: 'needsupdate',
  weightoverride: 'weightoverride',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_grade_items_historyScalarFieldEnum = {
  id: 'id',
  action: 'action',
  oldid: 'oldid',
  source: 'source',
  timemodified: 'timemodified',
  loggeduser: 'loggeduser',
  courseid: 'courseid',
  categoryid: 'categoryid',
  itemname: 'itemname',
  itemtype: 'itemtype',
  itemmodule: 'itemmodule',
  iteminstance: 'iteminstance',
  itemnumber: 'itemnumber',
  iteminfo: 'iteminfo',
  idnumber: 'idnumber',
  calculation: 'calculation',
  gradetype: 'gradetype',
  grademax: 'grademax',
  grademin: 'grademin',
  scaleid: 'scaleid',
  outcomeid: 'outcomeid',
  gradepass: 'gradepass',
  multfactor: 'multfactor',
  plusfactor: 'plusfactor',
  aggregationcoef: 'aggregationcoef',
  aggregationcoef2: 'aggregationcoef2',
  sortorder: 'sortorder',
  hidden: 'hidden',
  locked: 'locked',
  locktime: 'locktime',
  needsupdate: 'needsupdate',
  display: 'display',
  decimals: 'decimals',
  weightoverride: 'weightoverride'
};

exports.Prisma.Mdl_grade_lettersScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  lowerboundary: 'lowerboundary',
  letter: 'letter'
};

exports.Prisma.Mdl_grade_outcomesScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  shortname: 'shortname',
  fullname: 'fullname',
  scaleid: 'scaleid',
  description: 'description',
  descriptionformat: 'descriptionformat',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_grade_outcomes_coursesScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  outcomeid: 'outcomeid'
};

exports.Prisma.Mdl_grade_outcomes_historyScalarFieldEnum = {
  id: 'id',
  action: 'action',
  oldid: 'oldid',
  source: 'source',
  timemodified: 'timemodified',
  loggeduser: 'loggeduser',
  courseid: 'courseid',
  shortname: 'shortname',
  fullname: 'fullname',
  scaleid: 'scaleid',
  description: 'description',
  descriptionformat: 'descriptionformat'
};

exports.Prisma.Mdl_grade_settingsScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_grading_areasScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  component: 'component',
  areaname: 'areaname',
  activemethod: 'activemethod'
};

exports.Prisma.Mdl_grading_definitionsScalarFieldEnum = {
  id: 'id',
  areaid: 'areaid',
  method: 'method',
  name: 'name',
  description: 'description',
  descriptionformat: 'descriptionformat',
  status: 'status',
  copiedfromid: 'copiedfromid',
  timecreated: 'timecreated',
  usercreated: 'usercreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified',
  timecopied: 'timecopied',
  options: 'options'
};

exports.Prisma.Mdl_grading_instancesScalarFieldEnum = {
  id: 'id',
  definitionid: 'definitionid',
  raterid: 'raterid',
  itemid: 'itemid',
  rawgrade: 'rawgrade',
  status: 'status',
  feedback: 'feedback',
  feedbackformat: 'feedbackformat',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_gradingform_guide_commentsScalarFieldEnum = {
  id: 'id',
  definitionid: 'definitionid',
  sortorder: 'sortorder',
  description: 'description',
  descriptionformat: 'descriptionformat'
};

exports.Prisma.Mdl_gradingform_guide_criteriaScalarFieldEnum = {
  id: 'id',
  definitionid: 'definitionid',
  sortorder: 'sortorder',
  shortname: 'shortname',
  description: 'description',
  descriptionformat: 'descriptionformat',
  descriptionmarkers: 'descriptionmarkers',
  descriptionmarkersformat: 'descriptionmarkersformat',
  maxscore: 'maxscore'
};

exports.Prisma.Mdl_gradingform_guide_fillingsScalarFieldEnum = {
  id: 'id',
  instanceid: 'instanceid',
  criterionid: 'criterionid',
  remark: 'remark',
  remarkformat: 'remarkformat',
  score: 'score'
};

exports.Prisma.Mdl_gradingform_rubric_criteriaScalarFieldEnum = {
  id: 'id',
  definitionid: 'definitionid',
  sortorder: 'sortorder',
  description: 'description',
  descriptionformat: 'descriptionformat'
};

exports.Prisma.Mdl_gradingform_rubric_fillingsScalarFieldEnum = {
  id: 'id',
  instanceid: 'instanceid',
  criterionid: 'criterionid',
  levelid: 'levelid',
  remark: 'remark',
  remarkformat: 'remarkformat'
};

exports.Prisma.Mdl_gradingform_rubric_levelsScalarFieldEnum = {
  id: 'id',
  criterionid: 'criterionid',
  score: 'score',
  definition: 'definition',
  definitionformat: 'definitionformat'
};

exports.Prisma.Mdl_groupingsScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  name: 'name',
  idnumber: 'idnumber',
  description: 'description',
  descriptionformat: 'descriptionformat',
  configdata: 'configdata',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_groupings_groupsScalarFieldEnum = {
  id: 'id',
  groupingid: 'groupingid',
  groupid: 'groupid',
  timeadded: 'timeadded'
};

exports.Prisma.Mdl_groupsScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  idnumber: 'idnumber',
  name: 'name',
  description: 'description',
  descriptionformat: 'descriptionformat',
  enrolmentkey: 'enrolmentkey',
  picture: 'picture',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_groups_membersScalarFieldEnum = {
  id: 'id',
  groupid: 'groupid',
  userid: 'userid',
  timeadded: 'timeadded',
  component: 'component',
  itemid: 'itemid'
};

exports.Prisma.Mdl_h5pScalarFieldEnum = {
  id: 'id',
  jsoncontent: 'jsoncontent',
  mainlibraryid: 'mainlibraryid',
  displayoptions: 'displayoptions',
  pathnamehash: 'pathnamehash',
  contenthash: 'contenthash',
  filtered: 'filtered',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_h5p_contents_librariesScalarFieldEnum = {
  id: 'id',
  h5pid: 'h5pid',
  libraryid: 'libraryid',
  dependencytype: 'dependencytype',
  dropcss: 'dropcss',
  weight: 'weight'
};

exports.Prisma.Mdl_h5p_librariesScalarFieldEnum = {
  id: 'id',
  machinename: 'machinename',
  title: 'title',
  majorversion: 'majorversion',
  minorversion: 'minorversion',
  patchversion: 'patchversion',
  runnable: 'runnable',
  fullscreen: 'fullscreen',
  embedtypes: 'embedtypes',
  preloadedjs: 'preloadedjs',
  preloadedcss: 'preloadedcss',
  droplibrarycss: 'droplibrarycss',
  semantics: 'semantics',
  addto: 'addto',
  coremajor: 'coremajor',
  coreminor: 'coreminor',
  metadatasettings: 'metadatasettings',
  tutorial: 'tutorial',
  example: 'example',
  enabled: 'enabled'
};

exports.Prisma.Mdl_h5p_libraries_cachedassetsScalarFieldEnum = {
  id: 'id',
  libraryid: 'libraryid',
  hash: 'hash'
};

exports.Prisma.Mdl_h5p_library_dependenciesScalarFieldEnum = {
  id: 'id',
  libraryid: 'libraryid',
  requiredlibraryid: 'requiredlibraryid',
  dependencytype: 'dependencytype'
};

exports.Prisma.Mdl_h5pactivityScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  intro: 'intro',
  introformat: 'introformat',
  grade: 'grade',
  displayoptions: 'displayoptions',
  enabletracking: 'enabletracking',
  grademethod: 'grademethod',
  reviewmode: 'reviewmode'
};

exports.Prisma.Mdl_h5pactivity_attemptsScalarFieldEnum = {
  id: 'id',
  h5pactivityid: 'h5pactivityid',
  userid: 'userid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  attempt: 'attempt',
  rawscore: 'rawscore',
  maxscore: 'maxscore',
  scaled: 'scaled',
  duration: 'duration',
  completion: 'completion',
  success: 'success'
};

exports.Prisma.Mdl_h5pactivity_attempts_resultsScalarFieldEnum = {
  id: 'id',
  attemptid: 'attemptid',
  subcontent: 'subcontent',
  timecreated: 'timecreated',
  interactiontype: 'interactiontype',
  description: 'description',
  correctpattern: 'correctpattern',
  response: 'response',
  additionals: 'additionals',
  rawscore: 'rawscore',
  maxscore: 'maxscore',
  duration: 'duration',
  completion: 'completion',
  success: 'success'
};

exports.Prisma.Mdl_imscpScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  revision: 'revision',
  keepold: 'keepold',
  structure: 'structure',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_infected_filesScalarFieldEnum = {
  id: 'id',
  filename: 'filename',
  quarantinedfile: 'quarantinedfile',
  userid: 'userid',
  reason: 'reason',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_labelScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_lessonScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  practice: 'practice',
  modattempts: 'modattempts',
  usepassword: 'usepassword',
  password: 'password',
  dependency: 'dependency',
  conditions: 'conditions',
  grade: 'grade',
  custom: 'custom',
  ongoing: 'ongoing',
  usemaxgrade: 'usemaxgrade',
  maxanswers: 'maxanswers',
  maxattempts: 'maxattempts',
  review: 'review',
  nextpagedefault: 'nextpagedefault',
  feedback: 'feedback',
  minquestions: 'minquestions',
  maxpages: 'maxpages',
  timelimit: 'timelimit',
  retake: 'retake',
  activitylink: 'activitylink',
  mediafile: 'mediafile',
  mediaheight: 'mediaheight',
  mediawidth: 'mediawidth',
  mediaclose: 'mediaclose',
  slideshow: 'slideshow',
  width: 'width',
  height: 'height',
  bgcolor: 'bgcolor',
  displayleft: 'displayleft',
  displayleftif: 'displayleftif',
  progressbar: 'progressbar',
  available: 'available',
  deadline: 'deadline',
  timemodified: 'timemodified',
  completionendreached: 'completionendreached',
  completiontimespent: 'completiontimespent',
  allowofflineattempts: 'allowofflineattempts'
};

exports.Prisma.Mdl_lesson_answersScalarFieldEnum = {
  id: 'id',
  lessonid: 'lessonid',
  pageid: 'pageid',
  jumpto: 'jumpto',
  grade: 'grade',
  score: 'score',
  flags: 'flags',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  answer: 'answer',
  answerformat: 'answerformat',
  response: 'response',
  responseformat: 'responseformat'
};

exports.Prisma.Mdl_lesson_attemptsScalarFieldEnum = {
  id: 'id',
  lessonid: 'lessonid',
  pageid: 'pageid',
  userid: 'userid',
  answerid: 'answerid',
  retry: 'retry',
  correct: 'correct',
  useranswer: 'useranswer',
  timeseen: 'timeseen'
};

exports.Prisma.Mdl_lesson_branchScalarFieldEnum = {
  id: 'id',
  lessonid: 'lessonid',
  userid: 'userid',
  pageid: 'pageid',
  retry: 'retry',
  flag: 'flag',
  timeseen: 'timeseen',
  nextpageid: 'nextpageid'
};

exports.Prisma.Mdl_lesson_gradesScalarFieldEnum = {
  id: 'id',
  lessonid: 'lessonid',
  userid: 'userid',
  grade: 'grade',
  late: 'late',
  completed: 'completed'
};

exports.Prisma.Mdl_lesson_overridesScalarFieldEnum = {
  id: 'id',
  lessonid: 'lessonid',
  groupid: 'groupid',
  userid: 'userid',
  available: 'available',
  deadline: 'deadline',
  timelimit: 'timelimit',
  review: 'review',
  maxattempts: 'maxattempts',
  retake: 'retake',
  password: 'password'
};

exports.Prisma.Mdl_lesson_pagesScalarFieldEnum = {
  id: 'id',
  lessonid: 'lessonid',
  prevpageid: 'prevpageid',
  nextpageid: 'nextpageid',
  qtype: 'qtype',
  qoption: 'qoption',
  layout: 'layout',
  display: 'display',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  title: 'title',
  contents: 'contents',
  contentsformat: 'contentsformat'
};

exports.Prisma.Mdl_lesson_timerScalarFieldEnum = {
  id: 'id',
  lessonid: 'lessonid',
  userid: 'userid',
  starttime: 'starttime',
  lessontime: 'lessontime',
  completed: 'completed',
  timemodifiedoffline: 'timemodifiedoffline'
};

exports.Prisma.Mdl_licenseScalarFieldEnum = {
  id: 'id',
  shortname: 'shortname',
  fullname: 'fullname',
  source: 'source',
  enabled: 'enabled',
  version: 'version',
  custom: 'custom',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_lock_dbScalarFieldEnum = {
  id: 'id',
  resourcekey: 'resourcekey',
  expires: 'expires',
  owner: 'owner'
};

exports.Prisma.Mdl_logScalarFieldEnum = {
  id: 'id',
  time: 'time',
  userid: 'userid',
  ip: 'ip',
  course: 'course',
  module: 'module',
  cmid: 'cmid',
  action: 'action',
  url: 'url',
  info: 'info'
};

exports.Prisma.Mdl_log_displayScalarFieldEnum = {
  id: 'id',
  module: 'module',
  action: 'action',
  mtable: 'mtable',
  field: 'field',
  component: 'component'
};

exports.Prisma.Mdl_log_queriesScalarFieldEnum = {
  id: 'id',
  qtype: 'qtype',
  sqltext: 'sqltext',
  sqlparams: 'sqlparams',
  error: 'error',
  info: 'info',
  backtrace: 'backtrace',
  exectime: 'exectime',
  timelogged: 'timelogged'
};

exports.Prisma.Mdl_logstore_standard_logScalarFieldEnum = {
  id: 'id',
  eventname: 'eventname',
  component: 'component',
  action: 'action',
  target: 'target',
  objecttable: 'objecttable',
  objectid: 'objectid',
  crud: 'crud',
  edulevel: 'edulevel',
  contextid: 'contextid',
  contextlevel: 'contextlevel',
  contextinstanceid: 'contextinstanceid',
  userid: 'userid',
  courseid: 'courseid',
  relateduserid: 'relateduserid',
  anonymous: 'anonymous',
  other: 'other',
  timecreated: 'timecreated',
  origin: 'origin',
  ip: 'ip',
  realuserid: 'realuserid'
};

exports.Prisma.Mdl_ltiScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  typeid: 'typeid',
  toolurl: 'toolurl',
  securetoolurl: 'securetoolurl',
  instructorchoicesendname: 'instructorchoicesendname',
  instructorchoicesendemailaddr: 'instructorchoicesendemailaddr',
  instructorchoiceallowroster: 'instructorchoiceallowroster',
  instructorchoiceallowsetting: 'instructorchoiceallowsetting',
  instructorcustomparameters: 'instructorcustomparameters',
  instructorchoiceacceptgrades: 'instructorchoiceacceptgrades',
  grade: 'grade',
  launchcontainer: 'launchcontainer',
  resourcekey: 'resourcekey',
  password: 'password',
  debuglaunch: 'debuglaunch',
  showtitlelaunch: 'showtitlelaunch',
  showdescriptionlaunch: 'showdescriptionlaunch',
  servicesalt: 'servicesalt',
  icon: 'icon',
  secureicon: 'secureicon'
};

exports.Prisma.Mdl_lti_access_tokensScalarFieldEnum = {
  id: 'id',
  typeid: 'typeid',
  scope: 'scope',
  token: 'token',
  validuntil: 'validuntil',
  timecreated: 'timecreated',
  lastaccess: 'lastaccess'
};

exports.Prisma.Mdl_lti_submissionScalarFieldEnum = {
  id: 'id',
  ltiid: 'ltiid',
  userid: 'userid',
  datesubmitted: 'datesubmitted',
  dateupdated: 'dateupdated',
  gradepercent: 'gradepercent',
  originalgrade: 'originalgrade',
  launchid: 'launchid',
  state: 'state'
};

exports.Prisma.Mdl_lti_tool_proxiesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  regurl: 'regurl',
  state: 'state',
  guid: 'guid',
  secret: 'secret',
  vendorcode: 'vendorcode',
  capabilityoffered: 'capabilityoffered',
  serviceoffered: 'serviceoffered',
  toolproxy: 'toolproxy',
  createdby: 'createdby',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_lti_tool_settingsScalarFieldEnum = {
  id: 'id',
  toolproxyid: 'toolproxyid',
  typeid: 'typeid',
  course: 'course',
  coursemoduleid: 'coursemoduleid',
  settings: 'settings',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_lti_typesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  baseurl: 'baseurl',
  tooldomain: 'tooldomain',
  state: 'state',
  course: 'course',
  coursevisible: 'coursevisible',
  ltiversion: 'ltiversion',
  clientid: 'clientid',
  toolproxyid: 'toolproxyid',
  enabledcapability: 'enabledcapability',
  parameter: 'parameter',
  icon: 'icon',
  secureicon: 'secureicon',
  createdby: 'createdby',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  description: 'description'
};

exports.Prisma.Mdl_lti_types_configScalarFieldEnum = {
  id: 'id',
  typeid: 'typeid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_ltiservice_gradebookservicesScalarFieldEnum = {
  id: 'id',
  gradeitemid: 'gradeitemid',
  courseid: 'courseid',
  toolproxyid: 'toolproxyid',
  typeid: 'typeid',
  baseurl: 'baseurl',
  ltilinkid: 'ltilinkid',
  resourceid: 'resourceid',
  tag: 'tag',
  subreviewurl: 'subreviewurl',
  subreviewparams: 'subreviewparams'
};

exports.Prisma.Mdl_messageScalarFieldEnum = {
  id: 'id',
  useridfrom: 'useridfrom',
  useridto: 'useridto',
  subject: 'subject',
  fullmessage: 'fullmessage',
  fullmessageformat: 'fullmessageformat',
  fullmessagehtml: 'fullmessagehtml',
  smallmessage: 'smallmessage',
  notification: 'notification',
  contexturl: 'contexturl',
  contexturlname: 'contexturlname',
  timecreated: 'timecreated',
  timeuserfromdeleted: 'timeuserfromdeleted',
  timeusertodeleted: 'timeusertodeleted',
  component: 'component',
  eventtype: 'eventtype',
  customdata: 'customdata'
};

exports.Prisma.Mdl_message_airnotifier_devicesScalarFieldEnum = {
  id: 'id',
  userdeviceid: 'userdeviceid',
  enable: 'enable'
};

exports.Prisma.Mdl_message_contact_requestsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  requesteduserid: 'requesteduserid',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_message_contactsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  contactid: 'contactid',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_message_conversation_actionsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  conversationid: 'conversationid',
  action: 'action',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_message_conversation_membersScalarFieldEnum = {
  id: 'id',
  conversationid: 'conversationid',
  userid: 'userid',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_message_conversationsScalarFieldEnum = {
  id: 'id',
  type: 'type',
  name: 'name',
  convhash: 'convhash',
  component: 'component',
  itemtype: 'itemtype',
  itemid: 'itemid',
  contextid: 'contextid',
  enabled: 'enabled',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_message_email_messagesScalarFieldEnum = {
  id: 'id',
  useridto: 'useridto',
  conversationid: 'conversationid',
  messageid: 'messageid'
};

exports.Prisma.Mdl_message_popupScalarFieldEnum = {
  id: 'id',
  messageid: 'messageid',
  isread: 'isread'
};

exports.Prisma.Mdl_message_popup_notificationsScalarFieldEnum = {
  id: 'id',
  notificationid: 'notificationid'
};

exports.Prisma.Mdl_message_processorsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  enabled: 'enabled'
};

exports.Prisma.Mdl_message_providersScalarFieldEnum = {
  id: 'id',
  name: 'name',
  component: 'component',
  capability: 'capability'
};

exports.Prisma.Mdl_message_readScalarFieldEnum = {
  id: 'id',
  useridfrom: 'useridfrom',
  useridto: 'useridto',
  subject: 'subject',
  fullmessage: 'fullmessage',
  fullmessageformat: 'fullmessageformat',
  fullmessagehtml: 'fullmessagehtml',
  smallmessage: 'smallmessage',
  notification: 'notification',
  contexturl: 'contexturl',
  contexturlname: 'contexturlname',
  timecreated: 'timecreated',
  timeread: 'timeread',
  timeuserfromdeleted: 'timeuserfromdeleted',
  timeusertodeleted: 'timeusertodeleted',
  component: 'component',
  eventtype: 'eventtype'
};

exports.Prisma.Mdl_message_user_actionsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  messageid: 'messageid',
  action: 'action',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_message_users_blockedScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  blockeduserid: 'blockeduserid',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_messageinbound_datakeysScalarFieldEnum = {
  id: 'id',
  handler: 'handler',
  datavalue: 'datavalue',
  datakey: 'datakey',
  timecreated: 'timecreated',
  expires: 'expires'
};

exports.Prisma.Mdl_messageinbound_handlersScalarFieldEnum = {
  id: 'id',
  component: 'component',
  classname: 'classname',
  defaultexpiration: 'defaultexpiration',
  validateaddress: 'validateaddress',
  enabled: 'enabled'
};

exports.Prisma.Mdl_messageinbound_messagelistScalarFieldEnum = {
  id: 'id',
  messageid: 'messageid',
  userid: 'userid',
  address: 'address',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_messagesScalarFieldEnum = {
  id: 'id',
  useridfrom: 'useridfrom',
  conversationid: 'conversationid',
  subject: 'subject',
  fullmessage: 'fullmessage',
  fullmessageformat: 'fullmessageformat',
  fullmessagehtml: 'fullmessagehtml',
  smallmessage: 'smallmessage',
  timecreated: 'timecreated',
  fullmessagetrust: 'fullmessagetrust',
  customdata: 'customdata'
};

exports.Prisma.Mdl_mnet_applicationScalarFieldEnum = {
  id: 'id',
  name: 'name',
  display_name: 'display_name',
  xmlrpc_server_url: 'xmlrpc_server_url',
  sso_land_url: 'sso_land_url',
  sso_jump_url: 'sso_jump_url'
};

exports.Prisma.Mdl_mnet_hostScalarFieldEnum = {
  id: 'id',
  deleted: 'deleted',
  wwwroot: 'wwwroot',
  ip_address: 'ip_address',
  name: 'name',
  public_key: 'public_key',
  public_key_expires: 'public_key_expires',
  transport: 'transport',
  portno: 'portno',
  last_connect_time: 'last_connect_time',
  last_log_id: 'last_log_id',
  force_theme: 'force_theme',
  theme: 'theme',
  applicationid: 'applicationid',
  sslverification: 'sslverification'
};

exports.Prisma.Mdl_mnet_host2serviceScalarFieldEnum = {
  id: 'id',
  hostid: 'hostid',
  serviceid: 'serviceid',
  publish: 'publish',
  subscribe: 'subscribe'
};

exports.Prisma.Mdl_mnet_logScalarFieldEnum = {
  id: 'id',
  hostid: 'hostid',
  remoteid: 'remoteid',
  time: 'time',
  userid: 'userid',
  ip: 'ip',
  course: 'course',
  coursename: 'coursename',
  module: 'module',
  cmid: 'cmid',
  action: 'action',
  url: 'url',
  info: 'info'
};

exports.Prisma.Mdl_mnet_remote_rpcScalarFieldEnum = {
  id: 'id',
  functionname: 'functionname',
  xmlrpcpath: 'xmlrpcpath',
  plugintype: 'plugintype',
  pluginname: 'pluginname',
  enabled: 'enabled'
};

exports.Prisma.Mdl_mnet_remote_service2rpcScalarFieldEnum = {
  id: 'id',
  serviceid: 'serviceid',
  rpcid: 'rpcid'
};

exports.Prisma.Mdl_mnet_rpcScalarFieldEnum = {
  id: 'id',
  functionname: 'functionname',
  xmlrpcpath: 'xmlrpcpath',
  plugintype: 'plugintype',
  pluginname: 'pluginname',
  enabled: 'enabled',
  help: 'help',
  profile: 'profile',
  filename: 'filename',
  classname: 'classname',
  static: 'static'
};

exports.Prisma.Mdl_mnet_serviceScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  apiversion: 'apiversion',
  offer: 'offer'
};

exports.Prisma.Mdl_mnet_service2rpcScalarFieldEnum = {
  id: 'id',
  serviceid: 'serviceid',
  rpcid: 'rpcid'
};

exports.Prisma.Mdl_mnet_sessionScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  username: 'username',
  token: 'token',
  mnethostid: 'mnethostid',
  useragent: 'useragent',
  confirm_timeout: 'confirm_timeout',
  session_id: 'session_id',
  expires: 'expires'
};

exports.Prisma.Mdl_mnet_sso_access_controlScalarFieldEnum = {
  id: 'id',
  username: 'username',
  mnet_host_id: 'mnet_host_id',
  accessctrl: 'accessctrl'
};

exports.Prisma.Mdl_mnetservice_enrol_coursesScalarFieldEnum = {
  id: 'id',
  hostid: 'hostid',
  remoteid: 'remoteid',
  categoryid: 'categoryid',
  categoryname: 'categoryname',
  sortorder: 'sortorder',
  fullname: 'fullname',
  shortname: 'shortname',
  idnumber: 'idnumber',
  summary: 'summary',
  summaryformat: 'summaryformat',
  startdate: 'startdate',
  roleid: 'roleid',
  rolename: 'rolename'
};

exports.Prisma.Mdl_mnetservice_enrol_enrolmentsScalarFieldEnum = {
  id: 'id',
  hostid: 'hostid',
  userid: 'userid',
  remotecourseid: 'remotecourseid',
  rolename: 'rolename',
  enroltime: 'enroltime',
  enroltype: 'enroltype'
};

exports.Prisma.Mdl_modulesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  cron: 'cron',
  lastcron: 'lastcron',
  search: 'search',
  visible: 'visible'
};

exports.Prisma.Mdl_my_pagesScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  name: 'name',
  private: 'private',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_notificationsScalarFieldEnum = {
  id: 'id',
  useridfrom: 'useridfrom',
  useridto: 'useridto',
  subject: 'subject',
  fullmessage: 'fullmessage',
  fullmessageformat: 'fullmessageformat',
  fullmessagehtml: 'fullmessagehtml',
  smallmessage: 'smallmessage',
  component: 'component',
  eventtype: 'eventtype',
  contexturl: 'contexturl',
  contexturlname: 'contexturlname',
  timeread: 'timeread',
  timecreated: 'timecreated',
  customdata: 'customdata'
};

exports.Prisma.Mdl_oauth2_access_tokenScalarFieldEnum = {
  id: 'id',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified',
  issuerid: 'issuerid',
  token: 'token',
  expires: 'expires',
  scope: 'scope'
};

exports.Prisma.Mdl_oauth2_endpointScalarFieldEnum = {
  id: 'id',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified',
  name: 'name',
  url: 'url',
  issuerid: 'issuerid'
};

exports.Prisma.Mdl_oauth2_issuerScalarFieldEnum = {
  id: 'id',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified',
  name: 'name',
  image: 'image',
  baseurl: 'baseurl',
  clientid: 'clientid',
  clientsecret: 'clientsecret',
  loginscopes: 'loginscopes',
  loginscopesoffline: 'loginscopesoffline',
  loginparams: 'loginparams',
  loginparamsoffline: 'loginparamsoffline',
  alloweddomains: 'alloweddomains',
  scopessupported: 'scopessupported',
  enabled: 'enabled',
  showonloginpage: 'showonloginpage',
  basicauth: 'basicauth',
  sortorder: 'sortorder',
  requireconfirmation: 'requireconfirmation',
  servicetype: 'servicetype',
  loginpagename: 'loginpagename'
};

exports.Prisma.Mdl_oauth2_refresh_tokenScalarFieldEnum = {
  id: 'id',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  userid: 'userid',
  issuerid: 'issuerid',
  token: 'token',
  scopehash: 'scopehash'
};

exports.Prisma.Mdl_oauth2_system_accountScalarFieldEnum = {
  id: 'id',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified',
  issuerid: 'issuerid',
  refreshtoken: 'refreshtoken',
  grantedscopes: 'grantedscopes',
  email: 'email',
  username: 'username'
};

exports.Prisma.Mdl_oauth2_user_field_mappingScalarFieldEnum = {
  id: 'id',
  timemodified: 'timemodified',
  timecreated: 'timecreated',
  usermodified: 'usermodified',
  issuerid: 'issuerid',
  externalfield: 'externalfield',
  internalfield: 'internalfield'
};

exports.Prisma.Mdl_pageScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  content: 'content',
  contentformat: 'contentformat',
  legacyfiles: 'legacyfiles',
  legacyfileslast: 'legacyfileslast',
  display: 'display',
  displayoptions: 'displayoptions',
  revision: 'revision',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_paygw_paypalScalarFieldEnum = {
  id: 'id',
  paymentid: 'paymentid',
  pp_orderid: 'pp_orderid'
};

exports.Prisma.Mdl_payment_accountsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  idnumber: 'idnumber',
  contextid: 'contextid',
  enabled: 'enabled',
  archived: 'archived',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_payment_gatewaysScalarFieldEnum = {
  id: 'id',
  accountid: 'accountid',
  gateway: 'gateway',
  enabled: 'enabled',
  config: 'config',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_paymentsScalarFieldEnum = {
  id: 'id',
  component: 'component',
  paymentarea: 'paymentarea',
  itemid: 'itemid',
  userid: 'userid',
  amount: 'amount',
  currency: 'currency',
  accountid: 'accountid',
  gateway: 'gateway',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_portfolio_instanceScalarFieldEnum = {
  id: 'id',
  plugin: 'plugin',
  name: 'name',
  visible: 'visible'
};

exports.Prisma.Mdl_portfolio_instance_configScalarFieldEnum = {
  id: 'id',
  instance: 'instance',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_portfolio_instance_userScalarFieldEnum = {
  id: 'id',
  instance: 'instance',
  userid: 'userid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_portfolio_logScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  time: 'time',
  portfolio: 'portfolio',
  caller_class: 'caller_class',
  caller_file: 'caller_file',
  caller_component: 'caller_component',
  caller_sha1: 'caller_sha1',
  tempdataid: 'tempdataid',
  returnurl: 'returnurl',
  continueurl: 'continueurl'
};

exports.Prisma.Mdl_portfolio_mahara_queueScalarFieldEnum = {
  id: 'id',
  transferid: 'transferid',
  token: 'token'
};

exports.Prisma.Mdl_portfolio_tempdataScalarFieldEnum = {
  id: 'id',
  data: 'data',
  expirytime: 'expirytime',
  userid: 'userid',
  instance: 'instance',
  queued: 'queued'
};

exports.Prisma.Mdl_postScalarFieldEnum = {
  id: 'id',
  module: 'module',
  userid: 'userid',
  courseid: 'courseid',
  groupid: 'groupid',
  moduleid: 'moduleid',
  coursemoduleid: 'coursemoduleid',
  subject: 'subject',
  summary: 'summary',
  content: 'content',
  uniquehash: 'uniquehash',
  rating: 'rating',
  format: 'format',
  summaryformat: 'summaryformat',
  attachment: 'attachment',
  publishstate: 'publishstate',
  lastmodified: 'lastmodified',
  created: 'created',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_profilingScalarFieldEnum = {
  id: 'id',
  runid: 'runid',
  url: 'url',
  data: 'data',
  totalexecutiontime: 'totalexecutiontime',
  totalcputime: 'totalcputime',
  totalcalls: 'totalcalls',
  totalmemory: 'totalmemory',
  runreference: 'runreference',
  runcomment: 'runcomment',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_qtype_ddimageortextScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  shuffleanswers: 'shuffleanswers',
  correctfeedback: 'correctfeedback',
  correctfeedbackformat: 'correctfeedbackformat',
  partiallycorrectfeedback: 'partiallycorrectfeedback',
  partiallycorrectfeedbackformat: 'partiallycorrectfeedbackformat',
  incorrectfeedback: 'incorrectfeedback',
  incorrectfeedbackformat: 'incorrectfeedbackformat',
  shownumcorrect: 'shownumcorrect'
};

exports.Prisma.Mdl_qtype_ddimageortext_dragsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  no: 'no',
  draggroup: 'draggroup',
  infinite: 'infinite',
  label: 'label'
};

exports.Prisma.Mdl_qtype_ddimageortext_dropsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  no: 'no',
  xleft: 'xleft',
  ytop: 'ytop',
  choice: 'choice',
  label: 'label'
};

exports.Prisma.Mdl_qtype_ddmarkerScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  shuffleanswers: 'shuffleanswers',
  correctfeedback: 'correctfeedback',
  correctfeedbackformat: 'correctfeedbackformat',
  partiallycorrectfeedback: 'partiallycorrectfeedback',
  partiallycorrectfeedbackformat: 'partiallycorrectfeedbackformat',
  incorrectfeedback: 'incorrectfeedback',
  incorrectfeedbackformat: 'incorrectfeedbackformat',
  shownumcorrect: 'shownumcorrect',
  showmisplaced: 'showmisplaced'
};

exports.Prisma.Mdl_qtype_ddmarker_dragsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  no: 'no',
  label: 'label',
  infinite: 'infinite',
  noofdrags: 'noofdrags'
};

exports.Prisma.Mdl_qtype_ddmarker_dropsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  no: 'no',
  shape: 'shape',
  coords: 'coords',
  choice: 'choice'
};

exports.Prisma.Mdl_qtype_essay_optionsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  responseformat: 'responseformat',
  responserequired: 'responserequired',
  responsefieldlines: 'responsefieldlines',
  minwordlimit: 'minwordlimit',
  maxwordlimit: 'maxwordlimit',
  attachments: 'attachments',
  attachmentsrequired: 'attachmentsrequired',
  graderinfo: 'graderinfo',
  graderinfoformat: 'graderinfoformat',
  responsetemplate: 'responsetemplate',
  responsetemplateformat: 'responsetemplateformat',
  maxbytes: 'maxbytes',
  filetypeslist: 'filetypeslist'
};

exports.Prisma.Mdl_qtype_match_optionsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  shuffleanswers: 'shuffleanswers',
  correctfeedback: 'correctfeedback',
  correctfeedbackformat: 'correctfeedbackformat',
  partiallycorrectfeedback: 'partiallycorrectfeedback',
  partiallycorrectfeedbackformat: 'partiallycorrectfeedbackformat',
  incorrectfeedback: 'incorrectfeedback',
  incorrectfeedbackformat: 'incorrectfeedbackformat',
  shownumcorrect: 'shownumcorrect'
};

exports.Prisma.Mdl_qtype_match_subquestionsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  questiontext: 'questiontext',
  questiontextformat: 'questiontextformat',
  answertext: 'answertext'
};

exports.Prisma.Mdl_qtype_multichoice_optionsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  layout: 'layout',
  single: 'single',
  shuffleanswers: 'shuffleanswers',
  correctfeedback: 'correctfeedback',
  correctfeedbackformat: 'correctfeedbackformat',
  partiallycorrectfeedback: 'partiallycorrectfeedback',
  partiallycorrectfeedbackformat: 'partiallycorrectfeedbackformat',
  incorrectfeedback: 'incorrectfeedback',
  incorrectfeedbackformat: 'incorrectfeedbackformat',
  answernumbering: 'answernumbering',
  shownumcorrect: 'shownumcorrect',
  showstandardinstruction: 'showstandardinstruction'
};

exports.Prisma.Mdl_qtype_randomsamatch_optionsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  choose: 'choose',
  subcats: 'subcats',
  correctfeedback: 'correctfeedback',
  correctfeedbackformat: 'correctfeedbackformat',
  partiallycorrectfeedback: 'partiallycorrectfeedback',
  partiallycorrectfeedbackformat: 'partiallycorrectfeedbackformat',
  incorrectfeedback: 'incorrectfeedback',
  incorrectfeedbackformat: 'incorrectfeedbackformat',
  shownumcorrect: 'shownumcorrect'
};

exports.Prisma.Mdl_qtype_shortanswer_optionsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  usecase: 'usecase'
};

exports.Prisma.Mdl_questionScalarFieldEnum = {
  id: 'id',
  parent: 'parent',
  name: 'name',
  questiontext: 'questiontext',
  questiontextformat: 'questiontextformat',
  generalfeedback: 'generalfeedback',
  generalfeedbackformat: 'generalfeedbackformat',
  defaultmark: 'defaultmark',
  penalty: 'penalty',
  qtype: 'qtype',
  length: 'length',
  stamp: 'stamp',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  createdby: 'createdby',
  modifiedby: 'modifiedby'
};

exports.Prisma.Mdl_question_answersScalarFieldEnum = {
  id: 'id',
  question: 'question',
  answer: 'answer',
  answerformat: 'answerformat',
  fraction: 'fraction',
  feedback: 'feedback',
  feedbackformat: 'feedbackformat'
};

exports.Prisma.Mdl_question_attempt_step_dataScalarFieldEnum = {
  id: 'id',
  attemptstepid: 'attemptstepid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_question_attempt_stepsScalarFieldEnum = {
  id: 'id',
  questionattemptid: 'questionattemptid',
  sequencenumber: 'sequencenumber',
  state: 'state',
  fraction: 'fraction',
  timecreated: 'timecreated',
  userid: 'userid'
};

exports.Prisma.Mdl_question_attemptsScalarFieldEnum = {
  id: 'id',
  questionusageid: 'questionusageid',
  slot: 'slot',
  behaviour: 'behaviour',
  questionid: 'questionid',
  variant: 'variant',
  maxmark: 'maxmark',
  minfraction: 'minfraction',
  maxfraction: 'maxfraction',
  flagged: 'flagged',
  questionsummary: 'questionsummary',
  rightanswer: 'rightanswer',
  responsesummary: 'responsesummary',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_question_bank_entriesScalarFieldEnum = {
  id: 'id',
  questioncategoryid: 'questioncategoryid',
  idnumber: 'idnumber',
  ownerid: 'ownerid'
};

exports.Prisma.Mdl_question_calculatedScalarFieldEnum = {
  id: 'id',
  question: 'question',
  answer: 'answer',
  tolerance: 'tolerance',
  tolerancetype: 'tolerancetype',
  correctanswerlength: 'correctanswerlength',
  correctanswerformat: 'correctanswerformat'
};

exports.Prisma.Mdl_question_calculated_optionsScalarFieldEnum = {
  id: 'id',
  question: 'question',
  synchronize: 'synchronize',
  single: 'single',
  shuffleanswers: 'shuffleanswers',
  correctfeedback: 'correctfeedback',
  correctfeedbackformat: 'correctfeedbackformat',
  partiallycorrectfeedback: 'partiallycorrectfeedback',
  partiallycorrectfeedbackformat: 'partiallycorrectfeedbackformat',
  incorrectfeedback: 'incorrectfeedback',
  incorrectfeedbackformat: 'incorrectfeedbackformat',
  answernumbering: 'answernumbering',
  shownumcorrect: 'shownumcorrect'
};

exports.Prisma.Mdl_question_categoriesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  contextid: 'contextid',
  info: 'info',
  infoformat: 'infoformat',
  stamp: 'stamp',
  parent: 'parent',
  sortorder: 'sortorder',
  idnumber: 'idnumber'
};

exports.Prisma.Mdl_question_dataset_definitionsScalarFieldEnum = {
  id: 'id',
  category: 'category',
  name: 'name',
  type: 'type',
  options: 'options',
  itemcount: 'itemcount'
};

exports.Prisma.Mdl_question_dataset_itemsScalarFieldEnum = {
  id: 'id',
  definition: 'definition',
  itemnumber: 'itemnumber',
  value: 'value'
};

exports.Prisma.Mdl_question_datasetsScalarFieldEnum = {
  id: 'id',
  question: 'question',
  datasetdefinition: 'datasetdefinition'
};

exports.Prisma.Mdl_question_ddwtosScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  shuffleanswers: 'shuffleanswers',
  correctfeedback: 'correctfeedback',
  correctfeedbackformat: 'correctfeedbackformat',
  partiallycorrectfeedback: 'partiallycorrectfeedback',
  partiallycorrectfeedbackformat: 'partiallycorrectfeedbackformat',
  incorrectfeedback: 'incorrectfeedback',
  incorrectfeedbackformat: 'incorrectfeedbackformat',
  shownumcorrect: 'shownumcorrect'
};

exports.Prisma.Mdl_question_gapselectScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  shuffleanswers: 'shuffleanswers',
  correctfeedback: 'correctfeedback',
  correctfeedbackformat: 'correctfeedbackformat',
  partiallycorrectfeedback: 'partiallycorrectfeedback',
  partiallycorrectfeedbackformat: 'partiallycorrectfeedbackformat',
  incorrectfeedback: 'incorrectfeedback',
  incorrectfeedbackformat: 'incorrectfeedbackformat',
  shownumcorrect: 'shownumcorrect'
};

exports.Prisma.Mdl_question_hintsScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  hint: 'hint',
  hintformat: 'hintformat',
  shownumcorrect: 'shownumcorrect',
  clearwrong: 'clearwrong',
  options: 'options'
};

exports.Prisma.Mdl_question_multianswerScalarFieldEnum = {
  id: 'id',
  question: 'question',
  sequence: 'sequence'
};

exports.Prisma.Mdl_question_numericalScalarFieldEnum = {
  id: 'id',
  question: 'question',
  answer: 'answer',
  tolerance: 'tolerance'
};

exports.Prisma.Mdl_question_numerical_optionsScalarFieldEnum = {
  id: 'id',
  question: 'question',
  showunits: 'showunits',
  unitsleft: 'unitsleft',
  unitgradingtype: 'unitgradingtype',
  unitpenalty: 'unitpenalty'
};

exports.Prisma.Mdl_question_numerical_unitsScalarFieldEnum = {
  id: 'id',
  question: 'question',
  multiplier: 'multiplier',
  unit: 'unit'
};

exports.Prisma.Mdl_question_referencesScalarFieldEnum = {
  id: 'id',
  usingcontextid: 'usingcontextid',
  component: 'component',
  questionarea: 'questionarea',
  itemid: 'itemid',
  questionbankentryid: 'questionbankentryid',
  version: 'version'
};

exports.Prisma.Mdl_question_response_analysisScalarFieldEnum = {
  id: 'id',
  hashcode: 'hashcode',
  whichtries: 'whichtries',
  timemodified: 'timemodified',
  questionid: 'questionid',
  variant: 'variant',
  subqid: 'subqid',
  aid: 'aid',
  response: 'response',
  credit: 'credit'
};

exports.Prisma.Mdl_question_response_countScalarFieldEnum = {
  id: 'id',
  analysisid: 'analysisid',
  try: 'try',
  rcount: 'rcount'
};

exports.Prisma.Mdl_question_set_referencesScalarFieldEnum = {
  id: 'id',
  usingcontextid: 'usingcontextid',
  component: 'component',
  questionarea: 'questionarea',
  itemid: 'itemid',
  questionscontextid: 'questionscontextid',
  filtercondition: 'filtercondition'
};

exports.Prisma.Mdl_question_statisticsScalarFieldEnum = {
  id: 'id',
  hashcode: 'hashcode',
  timemodified: 'timemodified',
  questionid: 'questionid',
  slot: 'slot',
  subquestion: 'subquestion',
  variant: 'variant',
  s: 's',
  effectiveweight: 'effectiveweight',
  negcovar: 'negcovar',
  discriminationindex: 'discriminationindex',
  discriminativeefficiency: 'discriminativeefficiency',
  sd: 'sd',
  facility: 'facility',
  subquestions: 'subquestions',
  maxmark: 'maxmark',
  positions: 'positions',
  randomguessscore: 'randomguessscore'
};

exports.Prisma.Mdl_question_truefalseScalarFieldEnum = {
  id: 'id',
  question: 'question',
  trueanswer: 'trueanswer',
  falseanswer: 'falseanswer',
  showstandardinstruction: 'showstandardinstruction'
};

exports.Prisma.Mdl_question_usagesScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  component: 'component',
  preferredbehaviour: 'preferredbehaviour'
};

exports.Prisma.Mdl_question_versionsScalarFieldEnum = {
  id: 'id',
  questionbankentryid: 'questionbankentryid',
  version: 'version',
  questionid: 'questionid',
  status: 'status'
};

exports.Prisma.Mdl_questionnaireScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  qtype: 'qtype',
  respondenttype: 'respondenttype',
  resp_eligible: 'resp_eligible',
  resp_view: 'resp_view',
  notifications: 'notifications',
  opendate: 'opendate',
  closedate: 'closedate',
  resume: 'resume',
  navigate: 'navigate',
  grade: 'grade',
  sid: 'sid',
  timemodified: 'timemodified',
  completionsubmit: 'completionsubmit',
  autonum: 'autonum',
  progressbar: 'progressbar'
};

exports.Prisma.Mdl_questionnaire_dependencyScalarFieldEnum = {
  id: 'id',
  questionid: 'questionid',
  surveyid: 'surveyid',
  dependquestionid: 'dependquestionid',
  dependchoiceid: 'dependchoiceid',
  dependlogic: 'dependlogic',
  dependandor: 'dependandor'
};

exports.Prisma.Mdl_questionnaire_fb_sectionsScalarFieldEnum = {
  id: 'id',
  surveyid: 'surveyid',
  section: 'section',
  scorecalculation: 'scorecalculation',
  sectionlabel: 'sectionlabel',
  sectionheading: 'sectionheading',
  sectionheadingformat: 'sectionheadingformat'
};

exports.Prisma.Mdl_questionnaire_feedbackScalarFieldEnum = {
  id: 'id',
  sectionid: 'sectionid',
  feedbacklabel: 'feedbacklabel',
  feedbacktext: 'feedbacktext',
  feedbacktextformat: 'feedbacktextformat',
  minscore: 'minscore',
  maxscore: 'maxscore'
};

exports.Prisma.Mdl_questionnaire_quest_choiceScalarFieldEnum = {
  id: 'id',
  question_id: 'question_id',
  content: 'content',
  value: 'value'
};

exports.Prisma.Mdl_questionnaire_questionScalarFieldEnum = {
  id: 'id',
  surveyid: 'surveyid',
  name: 'name',
  type_id: 'type_id',
  result_id: 'result_id',
  length: 'length',
  precise: 'precise',
  position: 'position',
  content: 'content',
  required: 'required',
  deleted: 'deleted',
  extradata: 'extradata'
};

exports.Prisma.Mdl_questionnaire_question_typeScalarFieldEnum = {
  id: 'id',
  typeid: 'typeid',
  type: 'type',
  has_choices: 'has_choices',
  response_table: 'response_table'
};

exports.Prisma.Mdl_questionnaire_resp_multipleScalarFieldEnum = {
  id: 'id',
  response_id: 'response_id',
  question_id: 'question_id',
  choice_id: 'choice_id'
};

exports.Prisma.Mdl_questionnaire_resp_singleScalarFieldEnum = {
  id: 'id',
  response_id: 'response_id',
  question_id: 'question_id',
  choice_id: 'choice_id'
};

exports.Prisma.Mdl_questionnaire_responseScalarFieldEnum = {
  id: 'id',
  questionnaireid: 'questionnaireid',
  submitted: 'submitted',
  complete: 'complete',
  grade: 'grade',
  userid: 'userid'
};

exports.Prisma.Mdl_questionnaire_response_boolScalarFieldEnum = {
  id: 'id',
  response_id: 'response_id',
  question_id: 'question_id',
  choice_id: 'choice_id'
};

exports.Prisma.Mdl_questionnaire_response_dateScalarFieldEnum = {
  id: 'id',
  response_id: 'response_id',
  question_id: 'question_id',
  response: 'response'
};

exports.Prisma.Mdl_questionnaire_response_otherScalarFieldEnum = {
  id: 'id',
  response_id: 'response_id',
  question_id: 'question_id',
  choice_id: 'choice_id',
  response: 'response'
};

exports.Prisma.Mdl_questionnaire_response_rankScalarFieldEnum = {
  id: 'id',
  response_id: 'response_id',
  question_id: 'question_id',
  choice_id: 'choice_id',
  rankvalue: 'rankvalue'
};

exports.Prisma.Mdl_questionnaire_response_textScalarFieldEnum = {
  id: 'id',
  response_id: 'response_id',
  question_id: 'question_id',
  response: 'response'
};

exports.Prisma.Mdl_questionnaire_surveyScalarFieldEnum = {
  id: 'id',
  name: 'name',
  courseid: 'courseid',
  realm: 'realm',
  status: 'status',
  title: 'title',
  email: 'email',
  subtitle: 'subtitle',
  info: 'info',
  theme: 'theme',
  thanks_page: 'thanks_page',
  thank_head: 'thank_head',
  thank_body: 'thank_body',
  feedbacksections: 'feedbacksections',
  feedbacknotes: 'feedbacknotes',
  feedbackscores: 'feedbackscores',
  chart_type: 'chart_type'
};

exports.Prisma.Mdl_quizScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  timeopen: 'timeopen',
  timeclose: 'timeclose',
  timelimit: 'timelimit',
  overduehandling: 'overduehandling',
  graceperiod: 'graceperiod',
  preferredbehaviour: 'preferredbehaviour',
  canredoquestions: 'canredoquestions',
  attempts: 'attempts',
  attemptonlast: 'attemptonlast',
  grademethod: 'grademethod',
  decimalpoints: 'decimalpoints',
  questiondecimalpoints: 'questiondecimalpoints',
  reviewattempt: 'reviewattempt',
  reviewcorrectness: 'reviewcorrectness',
  reviewmarks: 'reviewmarks',
  reviewspecificfeedback: 'reviewspecificfeedback',
  reviewgeneralfeedback: 'reviewgeneralfeedback',
  reviewrightanswer: 'reviewrightanswer',
  reviewoverallfeedback: 'reviewoverallfeedback',
  questionsperpage: 'questionsperpage',
  navmethod: 'navmethod',
  shuffleanswers: 'shuffleanswers',
  sumgrades: 'sumgrades',
  grade: 'grade',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  password: 'password',
  subnet: 'subnet',
  browsersecurity: 'browsersecurity',
  delay1: 'delay1',
  delay2: 'delay2',
  showuserpicture: 'showuserpicture',
  showblocks: 'showblocks',
  completionattemptsexhausted: 'completionattemptsexhausted',
  completionminattempts: 'completionminattempts',
  allowofflineattempts: 'allowofflineattempts'
};

exports.Prisma.Mdl_quiz_attemptsScalarFieldEnum = {
  id: 'id',
  quiz: 'quiz',
  userid: 'userid',
  attempt: 'attempt',
  uniqueid: 'uniqueid',
  layout: 'layout',
  currentpage: 'currentpage',
  preview: 'preview',
  state: 'state',
  timestart: 'timestart',
  timefinish: 'timefinish',
  timemodified: 'timemodified',
  timemodifiedoffline: 'timemodifiedoffline',
  timecheckstate: 'timecheckstate',
  sumgrades: 'sumgrades',
  gradednotificationsenttime: 'gradednotificationsenttime'
};

exports.Prisma.Mdl_quiz_feedbackScalarFieldEnum = {
  id: 'id',
  quizid: 'quizid',
  feedbacktext: 'feedbacktext',
  feedbacktextformat: 'feedbacktextformat',
  mingrade: 'mingrade',
  maxgrade: 'maxgrade'
};

exports.Prisma.Mdl_quiz_gradesScalarFieldEnum = {
  id: 'id',
  quiz: 'quiz',
  userid: 'userid',
  grade: 'grade',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_quiz_overridesScalarFieldEnum = {
  id: 'id',
  quiz: 'quiz',
  groupid: 'groupid',
  userid: 'userid',
  timeopen: 'timeopen',
  timeclose: 'timeclose',
  timelimit: 'timelimit',
  attempts: 'attempts',
  password: 'password'
};

exports.Prisma.Mdl_quiz_overview_regradesScalarFieldEnum = {
  id: 'id',
  questionusageid: 'questionusageid',
  slot: 'slot',
  newfraction: 'newfraction',
  oldfraction: 'oldfraction',
  regraded: 'regraded',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_quiz_reportsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  displayorder: 'displayorder',
  capability: 'capability'
};

exports.Prisma.Mdl_quiz_sectionsScalarFieldEnum = {
  id: 'id',
  quizid: 'quizid',
  firstslot: 'firstslot',
  heading: 'heading',
  shufflequestions: 'shufflequestions'
};

exports.Prisma.Mdl_quiz_slotsScalarFieldEnum = {
  id: 'id',
  slot: 'slot',
  quizid: 'quizid',
  page: 'page',
  requireprevious: 'requireprevious',
  maxmark: 'maxmark'
};

exports.Prisma.Mdl_quiz_statisticsScalarFieldEnum = {
  id: 'id',
  hashcode: 'hashcode',
  whichattempts: 'whichattempts',
  timemodified: 'timemodified',
  firstattemptscount: 'firstattemptscount',
  highestattemptscount: 'highestattemptscount',
  lastattemptscount: 'lastattemptscount',
  allattemptscount: 'allattemptscount',
  firstattemptsavg: 'firstattemptsavg',
  highestattemptsavg: 'highestattemptsavg',
  lastattemptsavg: 'lastattemptsavg',
  allattemptsavg: 'allattemptsavg',
  median: 'median',
  standarddeviation: 'standarddeviation',
  skewness: 'skewness',
  kurtosis: 'kurtosis',
  cic: 'cic',
  errorratio: 'errorratio',
  standarderror: 'standarderror'
};

exports.Prisma.Mdl_quizaccess_seb_quizsettingsScalarFieldEnum = {
  id: 'id',
  quizid: 'quizid',
  cmid: 'cmid',
  templateid: 'templateid',
  requiresafeexambrowser: 'requiresafeexambrowser',
  showsebtaskbar: 'showsebtaskbar',
  showwificontrol: 'showwificontrol',
  showreloadbutton: 'showreloadbutton',
  showtime: 'showtime',
  showkeyboardlayout: 'showkeyboardlayout',
  allowuserquitseb: 'allowuserquitseb',
  quitpassword: 'quitpassword',
  linkquitseb: 'linkquitseb',
  userconfirmquit: 'userconfirmquit',
  enableaudiocontrol: 'enableaudiocontrol',
  muteonstartup: 'muteonstartup',
  allowspellchecking: 'allowspellchecking',
  allowreloadinexam: 'allowreloadinexam',
  activateurlfiltering: 'activateurlfiltering',
  filterembeddedcontent: 'filterembeddedcontent',
  expressionsallowed: 'expressionsallowed',
  regexallowed: 'regexallowed',
  expressionsblocked: 'expressionsblocked',
  regexblocked: 'regexblocked',
  allowedbrowserexamkeys: 'allowedbrowserexamkeys',
  showsebdownloadlink: 'showsebdownloadlink',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_quizaccess_seb_templateScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  content: 'content',
  enabled: 'enabled',
  sortorder: 'sortorder',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_ratingScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  component: 'component',
  ratingarea: 'ratingarea',
  itemid: 'itemid',
  scaleid: 'scaleid',
  rating: 'rating',
  userid: 'userid',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_registration_hubsScalarFieldEnum = {
  id: 'id',
  token: 'token',
  hubname: 'hubname',
  huburl: 'huburl',
  confirmed: 'confirmed',
  secret: 'secret',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_reportbuilder_audienceScalarFieldEnum = {
  id: 'id',
  reportid: 'reportid',
  heading: 'heading',
  classname: 'classname',
  configdata: 'configdata',
  usercreated: 'usercreated',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_reportbuilder_columnScalarFieldEnum = {
  id: 'id',
  reportid: 'reportid',
  uniqueidentifier: 'uniqueidentifier',
  aggregation: 'aggregation',
  heading: 'heading',
  columnorder: 'columnorder',
  sortenabled: 'sortenabled',
  sortdirection: 'sortdirection',
  sortorder: 'sortorder',
  usercreated: 'usercreated',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_reportbuilder_filterScalarFieldEnum = {
  id: 'id',
  reportid: 'reportid',
  uniqueidentifier: 'uniqueidentifier',
  heading: 'heading',
  iscondition: 'iscondition',
  filterorder: 'filterorder',
  usercreated: 'usercreated',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_reportbuilder_reportScalarFieldEnum = {
  id: 'id',
  name: 'name',
  source: 'source',
  type: 'type',
  uniquerows: 'uniquerows',
  conditiondata: 'conditiondata',
  settingsdata: 'settingsdata',
  contextid: 'contextid',
  component: 'component',
  area: 'area',
  itemid: 'itemid',
  usercreated: 'usercreated',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_reportbuilder_scheduleScalarFieldEnum = {
  id: 'id',
  reportid: 'reportid',
  name: 'name',
  enabled: 'enabled',
  audiences: 'audiences',
  format: 'format',
  subject: 'subject',
  message: 'message',
  messageformat: 'messageformat',
  userviewas: 'userviewas',
  timescheduled: 'timescheduled',
  recurrence: 'recurrence',
  reportempty: 'reportempty',
  timelastsent: 'timelastsent',
  timenextsend: 'timenextsend',
  usercreated: 'usercreated',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_repositoryScalarFieldEnum = {
  id: 'id',
  type: 'type',
  visible: 'visible',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_repository_instance_configScalarFieldEnum = {
  id: 'id',
  instanceid: 'instanceid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_repository_instancesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  typeid: 'typeid',
  userid: 'userid',
  contextid: 'contextid',
  username: 'username',
  password: 'password',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  readonly: 'readonly'
};

exports.Prisma.Mdl_repository_onedrive_accessScalarFieldEnum = {
  id: 'id',
  timemodified: 'timemodified',
  timecreated: 'timecreated',
  usermodified: 'usermodified',
  permissionid: 'permissionid',
  itemid: 'itemid'
};

exports.Prisma.Mdl_resourceScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  tobemigrated: 'tobemigrated',
  legacyfiles: 'legacyfiles',
  legacyfileslast: 'legacyfileslast',
  display: 'display',
  displayoptions: 'displayoptions',
  filterfiles: 'filterfiles',
  revision: 'revision',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_resource_oldScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  type: 'type',
  reference: 'reference',
  intro: 'intro',
  introformat: 'introformat',
  alltext: 'alltext',
  popup: 'popup',
  options: 'options',
  timemodified: 'timemodified',
  oldid: 'oldid',
  cmid: 'cmid',
  newmodule: 'newmodule',
  newid: 'newid',
  migrated: 'migrated'
};

exports.Prisma.Mdl_roleScalarFieldEnum = {
  id: 'id',
  name: 'name',
  shortname: 'shortname',
  description: 'description',
  sortorder: 'sortorder',
  archetype: 'archetype'
};

exports.Prisma.Mdl_role_allow_assignScalarFieldEnum = {
  id: 'id',
  roleid: 'roleid',
  allowassign: 'allowassign'
};

exports.Prisma.Mdl_role_allow_overrideScalarFieldEnum = {
  id: 'id',
  roleid: 'roleid',
  allowoverride: 'allowoverride'
};

exports.Prisma.Mdl_role_allow_switchScalarFieldEnum = {
  id: 'id',
  roleid: 'roleid',
  allowswitch: 'allowswitch'
};

exports.Prisma.Mdl_role_allow_viewScalarFieldEnum = {
  id: 'id',
  roleid: 'roleid',
  allowview: 'allowview'
};

exports.Prisma.Mdl_role_assignmentsScalarFieldEnum = {
  id: 'id',
  roleid: 'roleid',
  contextid: 'contextid',
  userid: 'userid',
  timemodified: 'timemodified',
  modifierid: 'modifierid',
  component: 'component',
  itemid: 'itemid',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_role_capabilitiesScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  roleid: 'roleid',
  capability: 'capability',
  permission: 'permission',
  timemodified: 'timemodified',
  modifierid: 'modifierid'
};

exports.Prisma.Mdl_role_context_levelsScalarFieldEnum = {
  id: 'id',
  roleid: 'roleid',
  contextlevel: 'contextlevel'
};

exports.Prisma.Mdl_role_namesScalarFieldEnum = {
  id: 'id',
  roleid: 'roleid',
  contextid: 'contextid',
  name: 'name'
};

exports.Prisma.Mdl_scaleScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  userid: 'userid',
  name: 'name',
  scale: 'scale',
  description: 'description',
  descriptionformat: 'descriptionformat',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_scale_historyScalarFieldEnum = {
  id: 'id',
  action: 'action',
  oldid: 'oldid',
  source: 'source',
  timemodified: 'timemodified',
  loggeduser: 'loggeduser',
  courseid: 'courseid',
  userid: 'userid',
  name: 'name',
  scale: 'scale',
  description: 'description'
};

exports.Prisma.Mdl_scormScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  scormtype: 'scormtype',
  reference: 'reference',
  intro: 'intro',
  introformat: 'introformat',
  version: 'version',
  maxgrade: 'maxgrade',
  grademethod: 'grademethod',
  whatgrade: 'whatgrade',
  maxattempt: 'maxattempt',
  forcecompleted: 'forcecompleted',
  forcenewattempt: 'forcenewattempt',
  lastattemptlock: 'lastattemptlock',
  masteryoverride: 'masteryoverride',
  displayattemptstatus: 'displayattemptstatus',
  displaycoursestructure: 'displaycoursestructure',
  updatefreq: 'updatefreq',
  sha1hash: 'sha1hash',
  md5hash: 'md5hash',
  revision: 'revision',
  launch: 'launch',
  skipview: 'skipview',
  hidebrowse: 'hidebrowse',
  hidetoc: 'hidetoc',
  nav: 'nav',
  navpositionleft: 'navpositionleft',
  navpositiontop: 'navpositiontop',
  auto: 'auto',
  popup: 'popup',
  options: 'options',
  width: 'width',
  height: 'height',
  timeopen: 'timeopen',
  timeclose: 'timeclose',
  timemodified: 'timemodified',
  completionstatusrequired: 'completionstatusrequired',
  completionscorerequired: 'completionscorerequired',
  completionstatusallscos: 'completionstatusallscos',
  autocommit: 'autocommit'
};

exports.Prisma.Mdl_scorm_aicc_sessionScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  scormid: 'scormid',
  hacpsession: 'hacpsession',
  scoid: 'scoid',
  scormmode: 'scormmode',
  scormstatus: 'scormstatus',
  attempt: 'attempt',
  lessonstatus: 'lessonstatus',
  sessiontime: 'sessiontime',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_scorm_scoesScalarFieldEnum = {
  id: 'id',
  scorm: 'scorm',
  manifest: 'manifest',
  organization: 'organization',
  parent: 'parent',
  identifier: 'identifier',
  launch: 'launch',
  scormtype: 'scormtype',
  title: 'title',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_scorm_scoes_dataScalarFieldEnum = {
  id: 'id',
  scoid: 'scoid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_scorm_scoes_trackScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  scormid: 'scormid',
  scoid: 'scoid',
  attempt: 'attempt',
  element: 'element',
  value: 'value',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_scorm_seq_mapinfoScalarFieldEnum = {
  id: 'id',
  scoid: 'scoid',
  objectiveid: 'objectiveid',
  targetobjectiveid: 'targetobjectiveid',
  readsatisfiedstatus: 'readsatisfiedstatus',
  readnormalizedmeasure: 'readnormalizedmeasure',
  writesatisfiedstatus: 'writesatisfiedstatus',
  writenormalizedmeasure: 'writenormalizedmeasure'
};

exports.Prisma.Mdl_scorm_seq_objectiveScalarFieldEnum = {
  id: 'id',
  scoid: 'scoid',
  primaryobj: 'primaryobj',
  objectiveid: 'objectiveid',
  satisfiedbymeasure: 'satisfiedbymeasure',
  minnormalizedmeasure: 'minnormalizedmeasure'
};

exports.Prisma.Mdl_scorm_seq_rollupruleScalarFieldEnum = {
  id: 'id',
  scoid: 'scoid',
  childactivityset: 'childactivityset',
  minimumcount: 'minimumcount',
  minimumpercent: 'minimumpercent',
  conditioncombination: 'conditioncombination',
  action: 'action'
};

exports.Prisma.Mdl_scorm_seq_rolluprulecondScalarFieldEnum = {
  id: 'id',
  scoid: 'scoid',
  rollupruleid: 'rollupruleid',
  operator: 'operator',
  cond: 'cond'
};

exports.Prisma.Mdl_scorm_seq_rulecondScalarFieldEnum = {
  id: 'id',
  scoid: 'scoid',
  ruleconditionsid: 'ruleconditionsid',
  refrencedobjective: 'refrencedobjective',
  measurethreshold: 'measurethreshold',
  operator: 'operator',
  cond: 'cond'
};

exports.Prisma.Mdl_scorm_seq_rulecondsScalarFieldEnum = {
  id: 'id',
  scoid: 'scoid',
  conditioncombination: 'conditioncombination',
  ruletype: 'ruletype',
  action: 'action'
};

exports.Prisma.Mdl_search_index_requestsScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  searcharea: 'searcharea',
  timerequested: 'timerequested',
  partialarea: 'partialarea',
  partialtime: 'partialtime',
  indexpriority: 'indexpriority'
};

exports.Prisma.Mdl_search_simpledb_indexScalarFieldEnum = {
  id: 'id',
  docid: 'docid',
  itemid: 'itemid',
  title: 'title',
  content: 'content',
  contextid: 'contextid',
  areaid: 'areaid',
  type: 'type',
  courseid: 'courseid',
  owneruserid: 'owneruserid',
  modified: 'modified',
  userid: 'userid',
  description1: 'description1',
  description2: 'description2'
};

exports.Prisma.Mdl_sessionsScalarFieldEnum = {
  id: 'id',
  state: 'state',
  sid: 'sid',
  userid: 'userid',
  sessdata: 'sessdata',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  firstip: 'firstip',
  lastip: 'lastip'
};

exports.Prisma.Mdl_stats_dailyScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  timeend: 'timeend',
  roleid: 'roleid',
  stattype: 'stattype',
  stat1: 'stat1',
  stat2: 'stat2'
};

exports.Prisma.Mdl_stats_monthlyScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  timeend: 'timeend',
  roleid: 'roleid',
  stattype: 'stattype',
  stat1: 'stat1',
  stat2: 'stat2'
};

exports.Prisma.Mdl_stats_user_dailyScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  userid: 'userid',
  roleid: 'roleid',
  timeend: 'timeend',
  statsreads: 'statsreads',
  statswrites: 'statswrites',
  stattype: 'stattype'
};

exports.Prisma.Mdl_stats_user_monthlyScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  userid: 'userid',
  roleid: 'roleid',
  timeend: 'timeend',
  statsreads: 'statsreads',
  statswrites: 'statswrites',
  stattype: 'stattype'
};

exports.Prisma.Mdl_stats_user_weeklyScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  userid: 'userid',
  roleid: 'roleid',
  timeend: 'timeend',
  statsreads: 'statsreads',
  statswrites: 'statswrites',
  stattype: 'stattype'
};

exports.Prisma.Mdl_stats_weeklyScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  timeend: 'timeend',
  roleid: 'roleid',
  stattype: 'stattype',
  stat1: 'stat1',
  stat2: 'stat2'
};

exports.Prisma.Mdl_surveyScalarFieldEnum = {
  id: 'id',
  course: 'course',
  template: 'template',
  days: 'days',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  questions: 'questions',
  completionsubmit: 'completionsubmit'
};

exports.Prisma.Mdl_survey_analysisScalarFieldEnum = {
  id: 'id',
  survey: 'survey',
  userid: 'userid',
  notes: 'notes'
};

exports.Prisma.Mdl_survey_answersScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  survey: 'survey',
  question: 'question',
  time: 'time',
  answer1: 'answer1',
  answer2: 'answer2'
};

exports.Prisma.Mdl_survey_questionsScalarFieldEnum = {
  id: 'id',
  text: 'text',
  shorttext: 'shorttext',
  multi: 'multi',
  intro: 'intro',
  type: 'type',
  options: 'options'
};

exports.Prisma.Mdl_tagScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  tagcollid: 'tagcollid',
  name: 'name',
  rawname: 'rawname',
  isstandard: 'isstandard',
  description: 'description',
  descriptionformat: 'descriptionformat',
  flag: 'flag',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_tag_areaScalarFieldEnum = {
  id: 'id',
  component: 'component',
  itemtype: 'itemtype',
  enabled: 'enabled',
  tagcollid: 'tagcollid',
  callback: 'callback',
  callbackfile: 'callbackfile',
  showstandard: 'showstandard',
  multiplecontexts: 'multiplecontexts'
};

exports.Prisma.Mdl_tag_collScalarFieldEnum = {
  id: 'id',
  name: 'name',
  isdefault: 'isdefault',
  component: 'component',
  sortorder: 'sortorder',
  searchable: 'searchable',
  customurl: 'customurl'
};

exports.Prisma.Mdl_tag_correlationScalarFieldEnum = {
  id: 'id',
  tagid: 'tagid',
  correlatedtags: 'correlatedtags'
};

exports.Prisma.Mdl_tag_instanceScalarFieldEnum = {
  id: 'id',
  tagid: 'tagid',
  component: 'component',
  itemtype: 'itemtype',
  itemid: 'itemid',
  contextid: 'contextid',
  tiuserid: 'tiuserid',
  ordering: 'ordering',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_task_adhocScalarFieldEnum = {
  id: 'id',
  component: 'component',
  classname: 'classname',
  nextruntime: 'nextruntime',
  faildelay: 'faildelay',
  customdata: 'customdata',
  userid: 'userid',
  blocking: 'blocking',
  timecreated: 'timecreated',
  timestarted: 'timestarted',
  hostname: 'hostname',
  pid: 'pid'
};

exports.Prisma.Mdl_task_logScalarFieldEnum = {
  id: 'id',
  type: 'type',
  component: 'component',
  classname: 'classname',
  userid: 'userid',
  timestart: 'timestart',
  timeend: 'timeend',
  dbreads: 'dbreads',
  dbwrites: 'dbwrites',
  result: 'result',
  output: 'output',
  hostname: 'hostname',
  pid: 'pid'
};

exports.Prisma.Mdl_task_scheduledScalarFieldEnum = {
  id: 'id',
  component: 'component',
  classname: 'classname',
  lastruntime: 'lastruntime',
  nextruntime: 'nextruntime',
  blocking: 'blocking',
  minute: 'minute',
  hour: 'hour',
  day: 'day',
  month: 'month',
  dayofweek: 'dayofweek',
  faildelay: 'faildelay',
  customised: 'customised',
  disabled: 'disabled',
  timestarted: 'timestarted',
  hostname: 'hostname',
  pid: 'pid'
};

exports.Prisma.Mdl_tiny_autosaveScalarFieldEnum = {
  id: 'id',
  elementid: 'elementid',
  contextid: 'contextid',
  pagehash: 'pagehash',
  userid: 'userid',
  drafttext: 'drafttext',
  draftid: 'draftid',
  pageinstance: 'pageinstance',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_tool_brickfield_areasScalarFieldEnum = {
  id: 'id',
  type: 'type',
  contextid: 'contextid',
  component: 'component',
  tablename: 'tablename',
  fieldorarea: 'fieldorarea',
  itemid: 'itemid',
  filename: 'filename',
  reftable: 'reftable',
  refid: 'refid',
  cmid: 'cmid',
  courseid: 'courseid',
  categoryid: 'categoryid'
};

exports.Prisma.Mdl_tool_brickfield_cache_actsScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  status: 'status',
  component: 'component',
  totalactivities: 'totalactivities',
  failedactivities: 'failedactivities',
  passedactivities: 'passedactivities',
  errorcount: 'errorcount'
};

exports.Prisma.Mdl_tool_brickfield_cache_checkScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  status: 'status',
  checkid: 'checkid',
  checkcount: 'checkcount',
  errorcount: 'errorcount'
};

exports.Prisma.Mdl_tool_brickfield_checksScalarFieldEnum = {
  id: 'id',
  checktype: 'checktype',
  shortname: 'shortname',
  checkgroup: 'checkgroup',
  status: 'status',
  severity: 'severity'
};

exports.Prisma.Mdl_tool_brickfield_contentScalarFieldEnum = {
  id: 'id',
  areaid: 'areaid',
  contenthash: 'contenthash',
  iscurrent: 'iscurrent',
  status: 'status',
  timecreated: 'timecreated',
  timechecked: 'timechecked'
};

exports.Prisma.Mdl_tool_brickfield_errorsScalarFieldEnum = {
  id: 'id',
  resultid: 'resultid',
  linenumber: 'linenumber',
  errordata: 'errordata',
  htmlcode: 'htmlcode'
};

exports.Prisma.Mdl_tool_brickfield_processScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  item: 'item',
  contextid: 'contextid',
  innercontextid: 'innercontextid',
  timecreated: 'timecreated',
  timecompleted: 'timecompleted'
};

exports.Prisma.Mdl_tool_brickfield_resultsScalarFieldEnum = {
  id: 'id',
  contentid: 'contentid',
  checkid: 'checkid',
  errorcount: 'errorcount'
};

exports.Prisma.Mdl_tool_brickfield_scheduleScalarFieldEnum = {
  id: 'id',
  contextlevel: 'contextlevel',
  instanceid: 'instanceid',
  contextid: 'contextid',
  status: 'status',
  timeanalyzed: 'timeanalyzed',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_tool_brickfield_summaryScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  status: 'status',
  activities: 'activities',
  activitiespassed: 'activitiespassed',
  activitiesfailed: 'activitiesfailed',
  errorschecktype1: 'errorschecktype1',
  errorschecktype2: 'errorschecktype2',
  errorschecktype3: 'errorschecktype3',
  errorschecktype4: 'errorschecktype4',
  errorschecktype5: 'errorschecktype5',
  errorschecktype6: 'errorschecktype6',
  errorschecktype7: 'errorschecktype7',
  failedchecktype1: 'failedchecktype1',
  failedchecktype2: 'failedchecktype2',
  failedchecktype3: 'failedchecktype3',
  failedchecktype4: 'failedchecktype4',
  failedchecktype5: 'failedchecktype5',
  failedchecktype6: 'failedchecktype6',
  failedchecktype7: 'failedchecktype7',
  percentchecktype1: 'percentchecktype1',
  percentchecktype2: 'percentchecktype2',
  percentchecktype3: 'percentchecktype3',
  percentchecktype4: 'percentchecktype4',
  percentchecktype5: 'percentchecktype5',
  percentchecktype6: 'percentchecktype6',
  percentchecktype7: 'percentchecktype7'
};

exports.Prisma.Mdl_tool_cohortrolesScalarFieldEnum = {
  id: 'id',
  cohortid: 'cohortid',
  roleid: 'roleid',
  userid: 'userid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  usermodified: 'usermodified'
};

exports.Prisma.Mdl_tool_customlangScalarFieldEnum = {
  id: 'id',
  lang: 'lang',
  componentid: 'componentid',
  stringid: 'stringid',
  original: 'original',
  master: 'master',
  local: 'local',
  timemodified: 'timemodified',
  timecustomized: 'timecustomized',
  outdated: 'outdated',
  modified: 'modified'
};

exports.Prisma.Mdl_tool_customlang_componentsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  version: 'version'
};

exports.Prisma.Mdl_tool_dataprivacy_categoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  descriptionformat: 'descriptionformat',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_tool_dataprivacy_ctxexpiredScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  unexpiredroles: 'unexpiredroles',
  expiredroles: 'expiredroles',
  defaultexpired: 'defaultexpired',
  status: 'status',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_tool_dataprivacy_ctxinstanceScalarFieldEnum = {
  id: 'id',
  contextid: 'contextid',
  purposeid: 'purposeid',
  categoryid: 'categoryid',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_tool_dataprivacy_ctxlevelScalarFieldEnum = {
  id: 'id',
  contextlevel: 'contextlevel',
  purposeid: 'purposeid',
  categoryid: 'categoryid',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_tool_dataprivacy_purposeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  descriptionformat: 'descriptionformat',
  lawfulbases: 'lawfulbases',
  sensitivedatareasons: 'sensitivedatareasons',
  retentionperiod: 'retentionperiod',
  protected: 'protected',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_tool_dataprivacy_purposeroleScalarFieldEnum = {
  id: 'id',
  purposeid: 'purposeid',
  roleid: 'roleid',
  lawfulbases: 'lawfulbases',
  sensitivedatareasons: 'sensitivedatareasons',
  retentionperiod: 'retentionperiod',
  protected: 'protected',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_tool_dataprivacy_requestScalarFieldEnum = {
  id: 'id',
  type: 'type',
  comments: 'comments',
  commentsformat: 'commentsformat',
  userid: 'userid',
  requestedby: 'requestedby',
  status: 'status',
  dpo: 'dpo',
  dpocomment: 'dpocomment',
  dpocommentformat: 'dpocommentformat',
  systemapproved: 'systemapproved',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  creationmethod: 'creationmethod'
};

exports.Prisma.Mdl_tool_monitor_eventsScalarFieldEnum = {
  id: 'id',
  eventname: 'eventname',
  contextid: 'contextid',
  contextlevel: 'contextlevel',
  contextinstanceid: 'contextinstanceid',
  link: 'link',
  courseid: 'courseid',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_tool_monitor_historyScalarFieldEnum = {
  id: 'id',
  sid: 'sid',
  userid: 'userid',
  timesent: 'timesent'
};

exports.Prisma.Mdl_tool_monitor_rulesScalarFieldEnum = {
  id: 'id',
  description: 'description',
  descriptionformat: 'descriptionformat',
  name: 'name',
  userid: 'userid',
  courseid: 'courseid',
  plugin: 'plugin',
  eventname: 'eventname',
  template: 'template',
  templateformat: 'templateformat',
  frequency: 'frequency',
  timewindow: 'timewindow',
  timemodified: 'timemodified',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_tool_monitor_subscriptionsScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  ruleid: 'ruleid',
  cmid: 'cmid',
  userid: 'userid',
  timecreated: 'timecreated',
  lastnotificationsent: 'lastnotificationsent',
  inactivedate: 'inactivedate'
};

exports.Prisma.Mdl_tool_policyScalarFieldEnum = {
  id: 'id',
  sortorder: 'sortorder',
  currentversionid: 'currentversionid'
};

exports.Prisma.Mdl_tool_policy_acceptancesScalarFieldEnum = {
  id: 'id',
  policyversionid: 'policyversionid',
  userid: 'userid',
  status: 'status',
  lang: 'lang',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  note: 'note'
};

exports.Prisma.Mdl_tool_policy_versionsScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type',
  audience: 'audience',
  archived: 'archived',
  usermodified: 'usermodified',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  policyid: 'policyid',
  agreementstyle: 'agreementstyle',
  optional: 'optional',
  revision: 'revision',
  summary: 'summary',
  summaryformat: 'summaryformat',
  content: 'content',
  contentformat: 'contentformat'
};

exports.Prisma.Mdl_tool_recyclebin_categoryScalarFieldEnum = {
  id: 'id',
  categoryid: 'categoryid',
  shortname: 'shortname',
  fullname: 'fullname',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_tool_recyclebin_courseScalarFieldEnum = {
  id: 'id',
  courseid: 'courseid',
  section: 'section',
  module: 'module',
  name: 'name',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_tool_usertours_stepsScalarFieldEnum = {
  id: 'id',
  tourid: 'tourid',
  title: 'title',
  content: 'content',
  contentformat: 'contentformat',
  targettype: 'targettype',
  targetvalue: 'targetvalue',
  sortorder: 'sortorder',
  configdata: 'configdata'
};

exports.Prisma.Mdl_tool_usertours_toursScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  pathmatch: 'pathmatch',
  enabled: 'enabled',
  sortorder: 'sortorder',
  endtourlabel: 'endtourlabel',
  configdata: 'configdata',
  displaystepnumbers: 'displaystepnumbers'
};

exports.Prisma.Mdl_upgrade_logScalarFieldEnum = {
  id: 'id',
  type: 'type',
  plugin: 'plugin',
  version: 'version',
  targetversion: 'targetversion',
  info: 'info',
  details: 'details',
  backtrace: 'backtrace',
  userid: 'userid',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_urlScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  externalurl: 'externalurl',
  display: 'display',
  displayoptions: 'displayoptions',
  parameters: 'parameters',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_userScalarFieldEnum = {
  id: 'id',
  auth: 'auth',
  confirmed: 'confirmed',
  policyagreed: 'policyagreed',
  deleted: 'deleted',
  suspended: 'suspended',
  mnethostid: 'mnethostid',
  username: 'username',
  password: 'password',
  idnumber: 'idnumber',
  firstname: 'firstname',
  lastname: 'lastname',
  email: 'email',
  emailstop: 'emailstop',
  phone1: 'phone1',
  phone2: 'phone2',
  institution: 'institution',
  department: 'department',
  address: 'address',
  city: 'city',
  country: 'country',
  lang: 'lang',
  calendartype: 'calendartype',
  theme: 'theme',
  timezone: 'timezone',
  firstaccess: 'firstaccess',
  lastaccess: 'lastaccess',
  lastlogin: 'lastlogin',
  currentlogin: 'currentlogin',
  lastip: 'lastip',
  secret: 'secret',
  picture: 'picture',
  description: 'description',
  descriptionformat: 'descriptionformat',
  mailformat: 'mailformat',
  maildigest: 'maildigest',
  maildisplay: 'maildisplay',
  autosubscribe: 'autosubscribe',
  trackforums: 'trackforums',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  trustbitmask: 'trustbitmask',
  imagealt: 'imagealt',
  lastnamephonetic: 'lastnamephonetic',
  firstnamephonetic: 'firstnamephonetic',
  middlename: 'middlename',
  alternatename: 'alternatename',
  moodlenetprofile: 'moodlenetprofile'
};

exports.Prisma.Mdl_user_devicesScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  appid: 'appid',
  name: 'name',
  model: 'model',
  platform: 'platform',
  version: 'version',
  pushid: 'pushid',
  uuid: 'uuid',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_user_enrolmentsScalarFieldEnum = {
  id: 'id',
  status: 'status',
  enrolid: 'enrolid',
  userid: 'userid',
  timestart: 'timestart',
  timeend: 'timeend',
  modifierid: 'modifierid',
  timecreated: 'timecreated',
  timemodified: 'timemodified'
};

exports.Prisma.Mdl_user_info_categoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  sortorder: 'sortorder'
};

exports.Prisma.Mdl_user_info_dataScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  fieldid: 'fieldid',
  data: 'data',
  dataformat: 'dataformat'
};

exports.Prisma.Mdl_user_info_fieldScalarFieldEnum = {
  id: 'id',
  shortname: 'shortname',
  name: 'name',
  datatype: 'datatype',
  description: 'description',
  descriptionformat: 'descriptionformat',
  categoryid: 'categoryid',
  sortorder: 'sortorder',
  required: 'required',
  locked: 'locked',
  visible: 'visible',
  forceunique: 'forceunique',
  signup: 'signup',
  defaultdata: 'defaultdata',
  defaultdataformat: 'defaultdataformat',
  param1: 'param1',
  param2: 'param2',
  param3: 'param3',
  param4: 'param4',
  param5: 'param5'
};

exports.Prisma.Mdl_user_lastaccessScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  courseid: 'courseid',
  timeaccess: 'timeaccess'
};

exports.Prisma.Mdl_user_password_historyScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  hash: 'hash',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_user_password_resetsScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  timerequested: 'timerequested',
  timererequested: 'timererequested',
  token: 'token'
};

exports.Prisma.Mdl_user_preferencesScalarFieldEnum = {
  id: 'id',
  userid: 'userid',
  name: 'name',
  value: 'value'
};

exports.Prisma.Mdl_user_private_keyScalarFieldEnum = {
  id: 'id',
  script: 'script',
  value: 'value',
  userid: 'userid',
  instance: 'instance',
  iprestriction: 'iprestriction',
  validuntil: 'validuntil',
  timecreated: 'timecreated'
};

exports.Prisma.Mdl_wikiScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  firstpagetitle: 'firstpagetitle',
  wikimode: 'wikimode',
  defaultformat: 'defaultformat',
  forceformat: 'forceformat',
  editbegin: 'editbegin',
  editend: 'editend'
};

exports.Prisma.Mdl_wiki_linksScalarFieldEnum = {
  id: 'id',
  subwikiid: 'subwikiid',
  frompageid: 'frompageid',
  topageid: 'topageid',
  tomissingpage: 'tomissingpage'
};

exports.Prisma.Mdl_wiki_locksScalarFieldEnum = {
  id: 'id',
  pageid: 'pageid',
  sectionname: 'sectionname',
  userid: 'userid',
  lockedat: 'lockedat'
};

exports.Prisma.Mdl_wiki_pagesScalarFieldEnum = {
  id: 'id',
  subwikiid: 'subwikiid',
  title: 'title',
  cachedcontent: 'cachedcontent',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  timerendered: 'timerendered',
  userid: 'userid',
  pageviews: 'pageviews',
  readonly: 'readonly'
};

exports.Prisma.Mdl_wiki_subwikisScalarFieldEnum = {
  id: 'id',
  wikiid: 'wikiid',
  groupid: 'groupid',
  userid: 'userid'
};

exports.Prisma.Mdl_wiki_synonymsScalarFieldEnum = {
  id: 'id',
  subwikiid: 'subwikiid',
  pageid: 'pageid',
  pagesynonym: 'pagesynonym'
};

exports.Prisma.Mdl_wiki_versionsScalarFieldEnum = {
  id: 'id',
  pageid: 'pageid',
  content: 'content',
  contentformat: 'contentformat',
  version: 'version',
  timecreated: 'timecreated',
  userid: 'userid'
};

exports.Prisma.Mdl_workshopScalarFieldEnum = {
  id: 'id',
  course: 'course',
  name: 'name',
  intro: 'intro',
  introformat: 'introformat',
  instructauthors: 'instructauthors',
  instructauthorsformat: 'instructauthorsformat',
  instructreviewers: 'instructreviewers',
  instructreviewersformat: 'instructreviewersformat',
  timemodified: 'timemodified',
  phase: 'phase',
  useexamples: 'useexamples',
  usepeerassessment: 'usepeerassessment',
  useselfassessment: 'useselfassessment',
  grade: 'grade',
  gradinggrade: 'gradinggrade',
  strategy: 'strategy',
  evaluation: 'evaluation',
  gradedecimals: 'gradedecimals',
  submissiontypetext: 'submissiontypetext',
  submissiontypefile: 'submissiontypefile',
  nattachments: 'nattachments',
  submissionfiletypes: 'submissionfiletypes',
  latesubmissions: 'latesubmissions',
  maxbytes: 'maxbytes',
  examplesmode: 'examplesmode',
  submissionstart: 'submissionstart',
  submissionend: 'submissionend',
  assessmentstart: 'assessmentstart',
  assessmentend: 'assessmentend',
  phaseswitchassessment: 'phaseswitchassessment',
  conclusion: 'conclusion',
  conclusionformat: 'conclusionformat',
  overallfeedbackmode: 'overallfeedbackmode',
  overallfeedbackfiles: 'overallfeedbackfiles',
  overallfeedbackfiletypes: 'overallfeedbackfiletypes',
  overallfeedbackmaxbytes: 'overallfeedbackmaxbytes'
};

exports.Prisma.Mdl_workshop_aggregationsScalarFieldEnum = {
  id: 'id',
  workshopid: 'workshopid',
  userid: 'userid',
  gradinggrade: 'gradinggrade',
  timegraded: 'timegraded'
};

exports.Prisma.Mdl_workshop_assessmentsScalarFieldEnum = {
  id: 'id',
  submissionid: 'submissionid',
  reviewerid: 'reviewerid',
  weight: 'weight',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  grade: 'grade',
  gradinggrade: 'gradinggrade',
  gradinggradeover: 'gradinggradeover',
  gradinggradeoverby: 'gradinggradeoverby',
  feedbackauthor: 'feedbackauthor',
  feedbackauthorformat: 'feedbackauthorformat',
  feedbackauthorattachment: 'feedbackauthorattachment',
  feedbackreviewer: 'feedbackreviewer',
  feedbackreviewerformat: 'feedbackreviewerformat'
};

exports.Prisma.Mdl_workshop_gradesScalarFieldEnum = {
  id: 'id',
  assessmentid: 'assessmentid',
  strategy: 'strategy',
  dimensionid: 'dimensionid',
  grade: 'grade',
  peercomment: 'peercomment',
  peercommentformat: 'peercommentformat'
};

exports.Prisma.Mdl_workshop_submissionsScalarFieldEnum = {
  id: 'id',
  workshopid: 'workshopid',
  example: 'example',
  authorid: 'authorid',
  timecreated: 'timecreated',
  timemodified: 'timemodified',
  title: 'title',
  content: 'content',
  contentformat: 'contentformat',
  contenttrust: 'contenttrust',
  attachment: 'attachment',
  grade: 'grade',
  gradeover: 'gradeover',
  gradeoverby: 'gradeoverby',
  feedbackauthor: 'feedbackauthor',
  feedbackauthorformat: 'feedbackauthorformat',
  timegraded: 'timegraded',
  published: 'published',
  late: 'late'
};

exports.Prisma.Mdl_workshopallocation_scheduledScalarFieldEnum = {
  id: 'id',
  workshopid: 'workshopid',
  enabled: 'enabled',
  submissionend: 'submissionend',
  timeallocated: 'timeallocated',
  settings: 'settings',
  resultstatus: 'resultstatus',
  resultmessage: 'resultmessage',
  resultlog: 'resultlog'
};

exports.Prisma.Mdl_workshopeval_best_settingsScalarFieldEnum = {
  id: 'id',
  workshopid: 'workshopid',
  comparison: 'comparison'
};

exports.Prisma.Mdl_workshopform_accumulativeScalarFieldEnum = {
  id: 'id',
  workshopid: 'workshopid',
  sort: 'sort',
  description: 'description',
  descriptionformat: 'descriptionformat',
  grade: 'grade',
  weight: 'weight'
};

exports.Prisma.Mdl_workshopform_commentsScalarFieldEnum = {
  id: 'id',
  workshopid: 'workshopid',
  sort: 'sort',
  description: 'description',
  descriptionformat: 'descriptionformat'
};

exports.Prisma.Mdl_workshopform_numerrorsScalarFieldEnum = {
  id: 'id',
  workshopid: 'workshopid',
  sort: 'sort',
  description: 'description',
  descriptionformat: 'descriptionformat',
  descriptiontrust: 'descriptiontrust',
  grade0: 'grade0',
  grade1: 'grade1',
  weight: 'weight'
};

exports.Prisma.Mdl_workshopform_numerrors_mapScalarFieldEnum = {
  id: 'id',
  workshopid: 'workshopid',
  nonegative: 'nonegative',
  grade: 'grade'
};

exports.Prisma.Mdl_workshopform_rubricScalarFieldEnum = {
  id: 'id',
  workshopid: 'workshopid',
  sort: 'sort',
  description: 'description',
  descriptionformat: 'descriptionformat'
};

exports.Prisma.Mdl_workshopform_rubric_configScalarFieldEnum = {
  id: 'id',
  workshopid: 'workshopid',
  layout: 'layout'
};

exports.Prisma.Mdl_workshopform_rubric_levelsScalarFieldEnum = {
  id: 'id',
  dimensionid: 'dimensionid',
  grade: 'grade',
  definition: 'definition',
  definitionformat: 'definitionformat'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  mdl_adminpresets: 'mdl_adminpresets',
  mdl_adminpresets_app: 'mdl_adminpresets_app',
  mdl_adminpresets_app_it: 'mdl_adminpresets_app_it',
  mdl_adminpresets_app_it_a: 'mdl_adminpresets_app_it_a',
  mdl_adminpresets_app_plug: 'mdl_adminpresets_app_plug',
  mdl_adminpresets_it: 'mdl_adminpresets_it',
  mdl_adminpresets_it_a: 'mdl_adminpresets_it_a',
  mdl_adminpresets_plug: 'mdl_adminpresets_plug',
  mdl_analytics_indicator_calc: 'mdl_analytics_indicator_calc',
  mdl_analytics_models: 'mdl_analytics_models',
  mdl_analytics_models_log: 'mdl_analytics_models_log',
  mdl_analytics_predict_samples: 'mdl_analytics_predict_samples',
  mdl_analytics_prediction_actions: 'mdl_analytics_prediction_actions',
  mdl_analytics_predictions: 'mdl_analytics_predictions',
  mdl_analytics_train_samples: 'mdl_analytics_train_samples',
  mdl_analytics_used_analysables: 'mdl_analytics_used_analysables',
  mdl_analytics_used_files: 'mdl_analytics_used_files',
  mdl_assign: 'mdl_assign',
  mdl_assign_grades: 'mdl_assign_grades',
  mdl_assign_overrides: 'mdl_assign_overrides',
  mdl_assign_plugin_config: 'mdl_assign_plugin_config',
  mdl_assign_submission: 'mdl_assign_submission',
  mdl_assign_user_flags: 'mdl_assign_user_flags',
  mdl_assign_user_mapping: 'mdl_assign_user_mapping',
  mdl_assignfeedback_comments: 'mdl_assignfeedback_comments',
  mdl_assignfeedback_editpdf_annot: 'mdl_assignfeedback_editpdf_annot',
  mdl_assignfeedback_editpdf_cmnt: 'mdl_assignfeedback_editpdf_cmnt',
  mdl_assignfeedback_editpdf_quick: 'mdl_assignfeedback_editpdf_quick',
  mdl_assignfeedback_editpdf_rot: 'mdl_assignfeedback_editpdf_rot',
  mdl_assignfeedback_file: 'mdl_assignfeedback_file',
  mdl_assignment: 'mdl_assignment',
  mdl_assignment_submissions: 'mdl_assignment_submissions',
  mdl_assignment_upgrade: 'mdl_assignment_upgrade',
  mdl_assignsubmission_file: 'mdl_assignsubmission_file',
  mdl_assignsubmission_onlinetext: 'mdl_assignsubmission_onlinetext',
  mdl_auth_lti_linked_login: 'mdl_auth_lti_linked_login',
  mdl_auth_oauth2_linked_login: 'mdl_auth_oauth2_linked_login',
  mdl_auth_oidc_prevlogin: 'mdl_auth_oidc_prevlogin',
  mdl_auth_oidc_state: 'mdl_auth_oidc_state',
  mdl_auth_oidc_token: 'mdl_auth_oidc_token',
  mdl_backup_controllers: 'mdl_backup_controllers',
  mdl_backup_courses: 'mdl_backup_courses',
  mdl_backup_logs: 'mdl_backup_logs',
  mdl_badge: 'mdl_badge',
  mdl_badge_alignment: 'mdl_badge_alignment',
  mdl_badge_backpack: 'mdl_badge_backpack',
  mdl_badge_backpack_oauth2: 'mdl_badge_backpack_oauth2',
  mdl_badge_criteria: 'mdl_badge_criteria',
  mdl_badge_criteria_met: 'mdl_badge_criteria_met',
  mdl_badge_criteria_param: 'mdl_badge_criteria_param',
  mdl_badge_endorsement: 'mdl_badge_endorsement',
  mdl_badge_external: 'mdl_badge_external',
  mdl_badge_external_backpack: 'mdl_badge_external_backpack',
  mdl_badge_external_identifier: 'mdl_badge_external_identifier',
  mdl_badge_issued: 'mdl_badge_issued',
  mdl_badge_manual_award: 'mdl_badge_manual_award',
  mdl_badge_related: 'mdl_badge_related',
  mdl_bigbluebuttonbn: 'mdl_bigbluebuttonbn',
  mdl_bigbluebuttonbn_logs: 'mdl_bigbluebuttonbn_logs',
  mdl_bigbluebuttonbn_recordings: 'mdl_bigbluebuttonbn_recordings',
  mdl_block: 'mdl_block',
  mdl_block_instances: 'mdl_block_instances',
  mdl_block_positions: 'mdl_block_positions',
  mdl_block_recent_activity: 'mdl_block_recent_activity',
  mdl_block_recentlyaccesseditems: 'mdl_block_recentlyaccesseditems',
  mdl_block_rss_client: 'mdl_block_rss_client',
  mdl_block_xp: 'mdl_block_xp',
  mdl_block_xp_config: 'mdl_block_xp_config',
  mdl_block_xp_filters: 'mdl_block_xp_filters',
  mdl_block_xp_log: 'mdl_block_xp_log',
  mdl_blog_association: 'mdl_blog_association',
  mdl_blog_external: 'mdl_blog_external',
  mdl_book: 'mdl_book',
  mdl_book_chapters: 'mdl_book_chapters',
  mdl_cache_filters: 'mdl_cache_filters',
  mdl_cache_flags: 'mdl_cache_flags',
  mdl_capabilities: 'mdl_capabilities',
  mdl_chat: 'mdl_chat',
  mdl_chat_messages: 'mdl_chat_messages',
  mdl_chat_messages_current: 'mdl_chat_messages_current',
  mdl_chat_users: 'mdl_chat_users',
  mdl_choice: 'mdl_choice',
  mdl_choice_answers: 'mdl_choice_answers',
  mdl_choice_options: 'mdl_choice_options',
  mdl_cohort: 'mdl_cohort',
  mdl_cohort_members: 'mdl_cohort_members',
  mdl_comments: 'mdl_comments',
  mdl_competency: 'mdl_competency',
  mdl_competency_coursecomp: 'mdl_competency_coursecomp',
  mdl_competency_coursecompsetting: 'mdl_competency_coursecompsetting',
  mdl_competency_evidence: 'mdl_competency_evidence',
  mdl_competency_framework: 'mdl_competency_framework',
  mdl_competency_modulecomp: 'mdl_competency_modulecomp',
  mdl_competency_plan: 'mdl_competency_plan',
  mdl_competency_plancomp: 'mdl_competency_plancomp',
  mdl_competency_relatedcomp: 'mdl_competency_relatedcomp',
  mdl_competency_template: 'mdl_competency_template',
  mdl_competency_templatecohort: 'mdl_competency_templatecohort',
  mdl_competency_templatecomp: 'mdl_competency_templatecomp',
  mdl_competency_usercomp: 'mdl_competency_usercomp',
  mdl_competency_usercompcourse: 'mdl_competency_usercompcourse',
  mdl_competency_usercompplan: 'mdl_competency_usercompplan',
  mdl_competency_userevidence: 'mdl_competency_userevidence',
  mdl_competency_userevidencecomp: 'mdl_competency_userevidencecomp',
  mdl_config: 'mdl_config',
  mdl_config_log: 'mdl_config_log',
  mdl_config_plugins: 'mdl_config_plugins',
  mdl_contentbank_content: 'mdl_contentbank_content',
  mdl_context: 'mdl_context',
  mdl_context_temp: 'mdl_context_temp',
  mdl_course: 'mdl_course',
  mdl_course_categories: 'mdl_course_categories',
  mdl_course_completion_aggr_methd: 'mdl_course_completion_aggr_methd',
  mdl_course_completion_crit_compl: 'mdl_course_completion_crit_compl',
  mdl_course_completion_criteria: 'mdl_course_completion_criteria',
  mdl_course_completion_defaults: 'mdl_course_completion_defaults',
  mdl_course_completions: 'mdl_course_completions',
  mdl_course_format_options: 'mdl_course_format_options',
  mdl_course_modules: 'mdl_course_modules',
  mdl_course_modules_completion: 'mdl_course_modules_completion',
  mdl_course_modules_viewed: 'mdl_course_modules_viewed',
  mdl_course_published: 'mdl_course_published',
  mdl_course_request: 'mdl_course_request',
  mdl_course_sections: 'mdl_course_sections',
  mdl_customcert: 'mdl_customcert',
  mdl_customcert_elements: 'mdl_customcert_elements',
  mdl_customcert_issues: 'mdl_customcert_issues',
  mdl_customcert_pages: 'mdl_customcert_pages',
  mdl_customcert_templates: 'mdl_customcert_templates',
  mdl_customfield_category: 'mdl_customfield_category',
  mdl_customfield_data: 'mdl_customfield_data',
  mdl_customfield_field: 'mdl_customfield_field',
  mdl_data: 'mdl_data',
  mdl_data_content: 'mdl_data_content',
  mdl_data_fields: 'mdl_data_fields',
  mdl_data_records: 'mdl_data_records',
  mdl_editor_atto_autosave: 'mdl_editor_atto_autosave',
  mdl_enrol: 'mdl_enrol',
  mdl_enrol_flatfile: 'mdl_enrol_flatfile',
  mdl_enrol_lti_app_registration: 'mdl_enrol_lti_app_registration',
  mdl_enrol_lti_context: 'mdl_enrol_lti_context',
  mdl_enrol_lti_deployment: 'mdl_enrol_lti_deployment',
  mdl_enrol_lti_lti2_consumer: 'mdl_enrol_lti_lti2_consumer',
  mdl_enrol_lti_lti2_context: 'mdl_enrol_lti_lti2_context',
  mdl_enrol_lti_lti2_nonce: 'mdl_enrol_lti_lti2_nonce',
  mdl_enrol_lti_lti2_resource_link: 'mdl_enrol_lti_lti2_resource_link',
  mdl_enrol_lti_lti2_share_key: 'mdl_enrol_lti_lti2_share_key',
  mdl_enrol_lti_lti2_tool_proxy: 'mdl_enrol_lti_lti2_tool_proxy',
  mdl_enrol_lti_lti2_user_result: 'mdl_enrol_lti_lti2_user_result',
  mdl_enrol_lti_resource_link: 'mdl_enrol_lti_resource_link',
  mdl_enrol_lti_tool_consumer_map: 'mdl_enrol_lti_tool_consumer_map',
  mdl_enrol_lti_tools: 'mdl_enrol_lti_tools',
  mdl_enrol_lti_user_resource_link: 'mdl_enrol_lti_user_resource_link',
  mdl_enrol_lti_users: 'mdl_enrol_lti_users',
  mdl_enrol_paypal: 'mdl_enrol_paypal',
  mdl_event: 'mdl_event',
  mdl_event_subscriptions: 'mdl_event_subscriptions',
  mdl_events_handlers: 'mdl_events_handlers',
  mdl_events_queue: 'mdl_events_queue',
  mdl_events_queue_handlers: 'mdl_events_queue_handlers',
  mdl_external_functions: 'mdl_external_functions',
  mdl_external_services: 'mdl_external_services',
  mdl_external_services_functions: 'mdl_external_services_functions',
  mdl_external_services_users: 'mdl_external_services_users',
  mdl_external_tokens: 'mdl_external_tokens',
  mdl_favourite: 'mdl_favourite',
  mdl_feedback: 'mdl_feedback',
  mdl_feedback_completed: 'mdl_feedback_completed',
  mdl_feedback_completedtmp: 'mdl_feedback_completedtmp',
  mdl_feedback_item: 'mdl_feedback_item',
  mdl_feedback_sitecourse_map: 'mdl_feedback_sitecourse_map',
  mdl_feedback_template: 'mdl_feedback_template',
  mdl_feedback_value: 'mdl_feedback_value',
  mdl_feedback_valuetmp: 'mdl_feedback_valuetmp',
  mdl_file_conversion: 'mdl_file_conversion',
  mdl_files: 'mdl_files',
  mdl_files_reference: 'mdl_files_reference',
  mdl_filter_active: 'mdl_filter_active',
  mdl_filter_config: 'mdl_filter_config',
  mdl_folder: 'mdl_folder',
  mdl_forum: 'mdl_forum',
  mdl_forum_digests: 'mdl_forum_digests',
  mdl_forum_discussion_subs: 'mdl_forum_discussion_subs',
  mdl_forum_discussions: 'mdl_forum_discussions',
  mdl_forum_grades: 'mdl_forum_grades',
  mdl_forum_posts: 'mdl_forum_posts',
  mdl_forum_queue: 'mdl_forum_queue',
  mdl_forum_read: 'mdl_forum_read',
  mdl_forum_subscriptions: 'mdl_forum_subscriptions',
  mdl_forum_track_prefs: 'mdl_forum_track_prefs',
  mdl_glossary: 'mdl_glossary',
  mdl_glossary_alias: 'mdl_glossary_alias',
  mdl_glossary_categories: 'mdl_glossary_categories',
  mdl_glossary_entries: 'mdl_glossary_entries',
  mdl_glossary_entries_categories: 'mdl_glossary_entries_categories',
  mdl_glossary_formats: 'mdl_glossary_formats',
  mdl_grade_categories: 'mdl_grade_categories',
  mdl_grade_categories_history: 'mdl_grade_categories_history',
  mdl_grade_grades: 'mdl_grade_grades',
  mdl_grade_grades_history: 'mdl_grade_grades_history',
  mdl_grade_import_newitem: 'mdl_grade_import_newitem',
  mdl_grade_import_values: 'mdl_grade_import_values',
  mdl_grade_items: 'mdl_grade_items',
  mdl_grade_items_history: 'mdl_grade_items_history',
  mdl_grade_letters: 'mdl_grade_letters',
  mdl_grade_outcomes: 'mdl_grade_outcomes',
  mdl_grade_outcomes_courses: 'mdl_grade_outcomes_courses',
  mdl_grade_outcomes_history: 'mdl_grade_outcomes_history',
  mdl_grade_settings: 'mdl_grade_settings',
  mdl_grading_areas: 'mdl_grading_areas',
  mdl_grading_definitions: 'mdl_grading_definitions',
  mdl_grading_instances: 'mdl_grading_instances',
  mdl_gradingform_guide_comments: 'mdl_gradingform_guide_comments',
  mdl_gradingform_guide_criteria: 'mdl_gradingform_guide_criteria',
  mdl_gradingform_guide_fillings: 'mdl_gradingform_guide_fillings',
  mdl_gradingform_rubric_criteria: 'mdl_gradingform_rubric_criteria',
  mdl_gradingform_rubric_fillings: 'mdl_gradingform_rubric_fillings',
  mdl_gradingform_rubric_levels: 'mdl_gradingform_rubric_levels',
  mdl_groupings: 'mdl_groupings',
  mdl_groupings_groups: 'mdl_groupings_groups',
  mdl_groups: 'mdl_groups',
  mdl_groups_members: 'mdl_groups_members',
  mdl_h5p: 'mdl_h5p',
  mdl_h5p_contents_libraries: 'mdl_h5p_contents_libraries',
  mdl_h5p_libraries: 'mdl_h5p_libraries',
  mdl_h5p_libraries_cachedassets: 'mdl_h5p_libraries_cachedassets',
  mdl_h5p_library_dependencies: 'mdl_h5p_library_dependencies',
  mdl_h5pactivity: 'mdl_h5pactivity',
  mdl_h5pactivity_attempts: 'mdl_h5pactivity_attempts',
  mdl_h5pactivity_attempts_results: 'mdl_h5pactivity_attempts_results',
  mdl_imscp: 'mdl_imscp',
  mdl_infected_files: 'mdl_infected_files',
  mdl_label: 'mdl_label',
  mdl_lesson: 'mdl_lesson',
  mdl_lesson_answers: 'mdl_lesson_answers',
  mdl_lesson_attempts: 'mdl_lesson_attempts',
  mdl_lesson_branch: 'mdl_lesson_branch',
  mdl_lesson_grades: 'mdl_lesson_grades',
  mdl_lesson_overrides: 'mdl_lesson_overrides',
  mdl_lesson_pages: 'mdl_lesson_pages',
  mdl_lesson_timer: 'mdl_lesson_timer',
  mdl_license: 'mdl_license',
  mdl_lock_db: 'mdl_lock_db',
  mdl_log: 'mdl_log',
  mdl_log_display: 'mdl_log_display',
  mdl_log_queries: 'mdl_log_queries',
  mdl_logstore_standard_log: 'mdl_logstore_standard_log',
  mdl_lti: 'mdl_lti',
  mdl_lti_access_tokens: 'mdl_lti_access_tokens',
  mdl_lti_submission: 'mdl_lti_submission',
  mdl_lti_tool_proxies: 'mdl_lti_tool_proxies',
  mdl_lti_tool_settings: 'mdl_lti_tool_settings',
  mdl_lti_types: 'mdl_lti_types',
  mdl_lti_types_config: 'mdl_lti_types_config',
  mdl_ltiservice_gradebookservices: 'mdl_ltiservice_gradebookservices',
  mdl_message: 'mdl_message',
  mdl_message_airnotifier_devices: 'mdl_message_airnotifier_devices',
  mdl_message_contact_requests: 'mdl_message_contact_requests',
  mdl_message_contacts: 'mdl_message_contacts',
  mdl_message_conversation_actions: 'mdl_message_conversation_actions',
  mdl_message_conversation_members: 'mdl_message_conversation_members',
  mdl_message_conversations: 'mdl_message_conversations',
  mdl_message_email_messages: 'mdl_message_email_messages',
  mdl_message_popup: 'mdl_message_popup',
  mdl_message_popup_notifications: 'mdl_message_popup_notifications',
  mdl_message_processors: 'mdl_message_processors',
  mdl_message_providers: 'mdl_message_providers',
  mdl_message_read: 'mdl_message_read',
  mdl_message_user_actions: 'mdl_message_user_actions',
  mdl_message_users_blocked: 'mdl_message_users_blocked',
  mdl_messageinbound_datakeys: 'mdl_messageinbound_datakeys',
  mdl_messageinbound_handlers: 'mdl_messageinbound_handlers',
  mdl_messageinbound_messagelist: 'mdl_messageinbound_messagelist',
  mdl_messages: 'mdl_messages',
  mdl_mnet_application: 'mdl_mnet_application',
  mdl_mnet_host: 'mdl_mnet_host',
  mdl_mnet_host2service: 'mdl_mnet_host2service',
  mdl_mnet_log: 'mdl_mnet_log',
  mdl_mnet_remote_rpc: 'mdl_mnet_remote_rpc',
  mdl_mnet_remote_service2rpc: 'mdl_mnet_remote_service2rpc',
  mdl_mnet_rpc: 'mdl_mnet_rpc',
  mdl_mnet_service: 'mdl_mnet_service',
  mdl_mnet_service2rpc: 'mdl_mnet_service2rpc',
  mdl_mnet_session: 'mdl_mnet_session',
  mdl_mnet_sso_access_control: 'mdl_mnet_sso_access_control',
  mdl_mnetservice_enrol_courses: 'mdl_mnetservice_enrol_courses',
  mdl_mnetservice_enrol_enrolments: 'mdl_mnetservice_enrol_enrolments',
  mdl_modules: 'mdl_modules',
  mdl_my_pages: 'mdl_my_pages',
  mdl_notifications: 'mdl_notifications',
  mdl_oauth2_access_token: 'mdl_oauth2_access_token',
  mdl_oauth2_endpoint: 'mdl_oauth2_endpoint',
  mdl_oauth2_issuer: 'mdl_oauth2_issuer',
  mdl_oauth2_refresh_token: 'mdl_oauth2_refresh_token',
  mdl_oauth2_system_account: 'mdl_oauth2_system_account',
  mdl_oauth2_user_field_mapping: 'mdl_oauth2_user_field_mapping',
  mdl_page: 'mdl_page',
  mdl_paygw_paypal: 'mdl_paygw_paypal',
  mdl_payment_accounts: 'mdl_payment_accounts',
  mdl_payment_gateways: 'mdl_payment_gateways',
  mdl_payments: 'mdl_payments',
  mdl_portfolio_instance: 'mdl_portfolio_instance',
  mdl_portfolio_instance_config: 'mdl_portfolio_instance_config',
  mdl_portfolio_instance_user: 'mdl_portfolio_instance_user',
  mdl_portfolio_log: 'mdl_portfolio_log',
  mdl_portfolio_mahara_queue: 'mdl_portfolio_mahara_queue',
  mdl_portfolio_tempdata: 'mdl_portfolio_tempdata',
  mdl_post: 'mdl_post',
  mdl_profiling: 'mdl_profiling',
  mdl_qtype_ddimageortext: 'mdl_qtype_ddimageortext',
  mdl_qtype_ddimageortext_drags: 'mdl_qtype_ddimageortext_drags',
  mdl_qtype_ddimageortext_drops: 'mdl_qtype_ddimageortext_drops',
  mdl_qtype_ddmarker: 'mdl_qtype_ddmarker',
  mdl_qtype_ddmarker_drags: 'mdl_qtype_ddmarker_drags',
  mdl_qtype_ddmarker_drops: 'mdl_qtype_ddmarker_drops',
  mdl_qtype_essay_options: 'mdl_qtype_essay_options',
  mdl_qtype_match_options: 'mdl_qtype_match_options',
  mdl_qtype_match_subquestions: 'mdl_qtype_match_subquestions',
  mdl_qtype_multichoice_options: 'mdl_qtype_multichoice_options',
  mdl_qtype_randomsamatch_options: 'mdl_qtype_randomsamatch_options',
  mdl_qtype_shortanswer_options: 'mdl_qtype_shortanswer_options',
  mdl_question: 'mdl_question',
  mdl_question_answers: 'mdl_question_answers',
  mdl_question_attempt_step_data: 'mdl_question_attempt_step_data',
  mdl_question_attempt_steps: 'mdl_question_attempt_steps',
  mdl_question_attempts: 'mdl_question_attempts',
  mdl_question_bank_entries: 'mdl_question_bank_entries',
  mdl_question_calculated: 'mdl_question_calculated',
  mdl_question_calculated_options: 'mdl_question_calculated_options',
  mdl_question_categories: 'mdl_question_categories',
  mdl_question_dataset_definitions: 'mdl_question_dataset_definitions',
  mdl_question_dataset_items: 'mdl_question_dataset_items',
  mdl_question_datasets: 'mdl_question_datasets',
  mdl_question_ddwtos: 'mdl_question_ddwtos',
  mdl_question_gapselect: 'mdl_question_gapselect',
  mdl_question_hints: 'mdl_question_hints',
  mdl_question_multianswer: 'mdl_question_multianswer',
  mdl_question_numerical: 'mdl_question_numerical',
  mdl_question_numerical_options: 'mdl_question_numerical_options',
  mdl_question_numerical_units: 'mdl_question_numerical_units',
  mdl_question_references: 'mdl_question_references',
  mdl_question_response_analysis: 'mdl_question_response_analysis',
  mdl_question_response_count: 'mdl_question_response_count',
  mdl_question_set_references: 'mdl_question_set_references',
  mdl_question_statistics: 'mdl_question_statistics',
  mdl_question_truefalse: 'mdl_question_truefalse',
  mdl_question_usages: 'mdl_question_usages',
  mdl_question_versions: 'mdl_question_versions',
  mdl_questionnaire: 'mdl_questionnaire',
  mdl_questionnaire_dependency: 'mdl_questionnaire_dependency',
  mdl_questionnaire_fb_sections: 'mdl_questionnaire_fb_sections',
  mdl_questionnaire_feedback: 'mdl_questionnaire_feedback',
  mdl_questionnaire_quest_choice: 'mdl_questionnaire_quest_choice',
  mdl_questionnaire_question: 'mdl_questionnaire_question',
  mdl_questionnaire_question_type: 'mdl_questionnaire_question_type',
  mdl_questionnaire_resp_multiple: 'mdl_questionnaire_resp_multiple',
  mdl_questionnaire_resp_single: 'mdl_questionnaire_resp_single',
  mdl_questionnaire_response: 'mdl_questionnaire_response',
  mdl_questionnaire_response_bool: 'mdl_questionnaire_response_bool',
  mdl_questionnaire_response_date: 'mdl_questionnaire_response_date',
  mdl_questionnaire_response_other: 'mdl_questionnaire_response_other',
  mdl_questionnaire_response_rank: 'mdl_questionnaire_response_rank',
  mdl_questionnaire_response_text: 'mdl_questionnaire_response_text',
  mdl_questionnaire_survey: 'mdl_questionnaire_survey',
  mdl_quiz: 'mdl_quiz',
  mdl_quiz_attempts: 'mdl_quiz_attempts',
  mdl_quiz_feedback: 'mdl_quiz_feedback',
  mdl_quiz_grades: 'mdl_quiz_grades',
  mdl_quiz_overrides: 'mdl_quiz_overrides',
  mdl_quiz_overview_regrades: 'mdl_quiz_overview_regrades',
  mdl_quiz_reports: 'mdl_quiz_reports',
  mdl_quiz_sections: 'mdl_quiz_sections',
  mdl_quiz_slots: 'mdl_quiz_slots',
  mdl_quiz_statistics: 'mdl_quiz_statistics',
  mdl_quizaccess_seb_quizsettings: 'mdl_quizaccess_seb_quizsettings',
  mdl_quizaccess_seb_template: 'mdl_quizaccess_seb_template',
  mdl_rating: 'mdl_rating',
  mdl_registration_hubs: 'mdl_registration_hubs',
  mdl_reportbuilder_audience: 'mdl_reportbuilder_audience',
  mdl_reportbuilder_column: 'mdl_reportbuilder_column',
  mdl_reportbuilder_filter: 'mdl_reportbuilder_filter',
  mdl_reportbuilder_report: 'mdl_reportbuilder_report',
  mdl_reportbuilder_schedule: 'mdl_reportbuilder_schedule',
  mdl_repository: 'mdl_repository',
  mdl_repository_instance_config: 'mdl_repository_instance_config',
  mdl_repository_instances: 'mdl_repository_instances',
  mdl_repository_onedrive_access: 'mdl_repository_onedrive_access',
  mdl_resource: 'mdl_resource',
  mdl_resource_old: 'mdl_resource_old',
  mdl_role: 'mdl_role',
  mdl_role_allow_assign: 'mdl_role_allow_assign',
  mdl_role_allow_override: 'mdl_role_allow_override',
  mdl_role_allow_switch: 'mdl_role_allow_switch',
  mdl_role_allow_view: 'mdl_role_allow_view',
  mdl_role_assignments: 'mdl_role_assignments',
  mdl_role_capabilities: 'mdl_role_capabilities',
  mdl_role_context_levels: 'mdl_role_context_levels',
  mdl_role_names: 'mdl_role_names',
  mdl_scale: 'mdl_scale',
  mdl_scale_history: 'mdl_scale_history',
  mdl_scorm: 'mdl_scorm',
  mdl_scorm_aicc_session: 'mdl_scorm_aicc_session',
  mdl_scorm_scoes: 'mdl_scorm_scoes',
  mdl_scorm_scoes_data: 'mdl_scorm_scoes_data',
  mdl_scorm_scoes_track: 'mdl_scorm_scoes_track',
  mdl_scorm_seq_mapinfo: 'mdl_scorm_seq_mapinfo',
  mdl_scorm_seq_objective: 'mdl_scorm_seq_objective',
  mdl_scorm_seq_rolluprule: 'mdl_scorm_seq_rolluprule',
  mdl_scorm_seq_rolluprulecond: 'mdl_scorm_seq_rolluprulecond',
  mdl_scorm_seq_rulecond: 'mdl_scorm_seq_rulecond',
  mdl_scorm_seq_ruleconds: 'mdl_scorm_seq_ruleconds',
  mdl_search_index_requests: 'mdl_search_index_requests',
  mdl_search_simpledb_index: 'mdl_search_simpledb_index',
  mdl_sessions: 'mdl_sessions',
  mdl_stats_daily: 'mdl_stats_daily',
  mdl_stats_monthly: 'mdl_stats_monthly',
  mdl_stats_user_daily: 'mdl_stats_user_daily',
  mdl_stats_user_monthly: 'mdl_stats_user_monthly',
  mdl_stats_user_weekly: 'mdl_stats_user_weekly',
  mdl_stats_weekly: 'mdl_stats_weekly',
  mdl_survey: 'mdl_survey',
  mdl_survey_analysis: 'mdl_survey_analysis',
  mdl_survey_answers: 'mdl_survey_answers',
  mdl_survey_questions: 'mdl_survey_questions',
  mdl_tag: 'mdl_tag',
  mdl_tag_area: 'mdl_tag_area',
  mdl_tag_coll: 'mdl_tag_coll',
  mdl_tag_correlation: 'mdl_tag_correlation',
  mdl_tag_instance: 'mdl_tag_instance',
  mdl_task_adhoc: 'mdl_task_adhoc',
  mdl_task_log: 'mdl_task_log',
  mdl_task_scheduled: 'mdl_task_scheduled',
  mdl_tiny_autosave: 'mdl_tiny_autosave',
  mdl_tool_brickfield_areas: 'mdl_tool_brickfield_areas',
  mdl_tool_brickfield_cache_acts: 'mdl_tool_brickfield_cache_acts',
  mdl_tool_brickfield_cache_check: 'mdl_tool_brickfield_cache_check',
  mdl_tool_brickfield_checks: 'mdl_tool_brickfield_checks',
  mdl_tool_brickfield_content: 'mdl_tool_brickfield_content',
  mdl_tool_brickfield_errors: 'mdl_tool_brickfield_errors',
  mdl_tool_brickfield_process: 'mdl_tool_brickfield_process',
  mdl_tool_brickfield_results: 'mdl_tool_brickfield_results',
  mdl_tool_brickfield_schedule: 'mdl_tool_brickfield_schedule',
  mdl_tool_brickfield_summary: 'mdl_tool_brickfield_summary',
  mdl_tool_cohortroles: 'mdl_tool_cohortroles',
  mdl_tool_customlang: 'mdl_tool_customlang',
  mdl_tool_customlang_components: 'mdl_tool_customlang_components',
  mdl_tool_dataprivacy_category: 'mdl_tool_dataprivacy_category',
  mdl_tool_dataprivacy_ctxexpired: 'mdl_tool_dataprivacy_ctxexpired',
  mdl_tool_dataprivacy_ctxinstance: 'mdl_tool_dataprivacy_ctxinstance',
  mdl_tool_dataprivacy_ctxlevel: 'mdl_tool_dataprivacy_ctxlevel',
  mdl_tool_dataprivacy_purpose: 'mdl_tool_dataprivacy_purpose',
  mdl_tool_dataprivacy_purposerole: 'mdl_tool_dataprivacy_purposerole',
  mdl_tool_dataprivacy_request: 'mdl_tool_dataprivacy_request',
  mdl_tool_monitor_events: 'mdl_tool_monitor_events',
  mdl_tool_monitor_history: 'mdl_tool_monitor_history',
  mdl_tool_monitor_rules: 'mdl_tool_monitor_rules',
  mdl_tool_monitor_subscriptions: 'mdl_tool_monitor_subscriptions',
  mdl_tool_policy: 'mdl_tool_policy',
  mdl_tool_policy_acceptances: 'mdl_tool_policy_acceptances',
  mdl_tool_policy_versions: 'mdl_tool_policy_versions',
  mdl_tool_recyclebin_category: 'mdl_tool_recyclebin_category',
  mdl_tool_recyclebin_course: 'mdl_tool_recyclebin_course',
  mdl_tool_usertours_steps: 'mdl_tool_usertours_steps',
  mdl_tool_usertours_tours: 'mdl_tool_usertours_tours',
  mdl_upgrade_log: 'mdl_upgrade_log',
  mdl_url: 'mdl_url',
  mdl_user: 'mdl_user',
  mdl_user_devices: 'mdl_user_devices',
  mdl_user_enrolments: 'mdl_user_enrolments',
  mdl_user_info_category: 'mdl_user_info_category',
  mdl_user_info_data: 'mdl_user_info_data',
  mdl_user_info_field: 'mdl_user_info_field',
  mdl_user_lastaccess: 'mdl_user_lastaccess',
  mdl_user_password_history: 'mdl_user_password_history',
  mdl_user_password_resets: 'mdl_user_password_resets',
  mdl_user_preferences: 'mdl_user_preferences',
  mdl_user_private_key: 'mdl_user_private_key',
  mdl_wiki: 'mdl_wiki',
  mdl_wiki_links: 'mdl_wiki_links',
  mdl_wiki_locks: 'mdl_wiki_locks',
  mdl_wiki_pages: 'mdl_wiki_pages',
  mdl_wiki_subwikis: 'mdl_wiki_subwikis',
  mdl_wiki_synonyms: 'mdl_wiki_synonyms',
  mdl_wiki_versions: 'mdl_wiki_versions',
  mdl_workshop: 'mdl_workshop',
  mdl_workshop_aggregations: 'mdl_workshop_aggregations',
  mdl_workshop_assessments: 'mdl_workshop_assessments',
  mdl_workshop_grades: 'mdl_workshop_grades',
  mdl_workshop_submissions: 'mdl_workshop_submissions',
  mdl_workshopallocation_scheduled: 'mdl_workshopallocation_scheduled',
  mdl_workshopeval_best_settings: 'mdl_workshopeval_best_settings',
  mdl_workshopform_accumulative: 'mdl_workshopform_accumulative',
  mdl_workshopform_comments: 'mdl_workshopform_comments',
  mdl_workshopform_numerrors: 'mdl_workshopform_numerrors',
  mdl_workshopform_numerrors_map: 'mdl_workshopform_numerrors_map',
  mdl_workshopform_rubric: 'mdl_workshopform_rubric',
  mdl_workshopform_rubric_config: 'mdl_workshopform_rubric_config',
  mdl_workshopform_rubric_levels: 'mdl_workshopform_rubric_levels'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        const runtime = detectRuntime()
        const edgeRuntimeName = {
          'workerd': 'Cloudflare Workers',
          'deno': 'Deno and Deno Deploy',
          'netlify': 'Netlify Edge Functions',
          'edge-light': 'Vercel Edge Functions',
        }[runtime]

        let message = 'PrismaClient is unable to run in '
        if (edgeRuntimeName !== undefined) {
          message += edgeRuntimeName + '. As an alternative, try Accelerate: https://pris.ly/d/accelerate.'
        } else {
          message += 'this browser environment, or has been bundled for the browser (running in `' + runtime + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://github.com/prisma/prisma/issues`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
