const {client, xml} = require('@xmpp/client')
const debug = require('@xmpp/debug')
const resource = 'example'; //Math.random().toString(36).substring(7);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const xmpp = client({
    service: 'xmpp://localhost:5222',
    domain: 'localhost',
    resource: resource,
    username: 'admin',
    password: 'admin'
})

debug(xmpp, true)
 
xmpp.on('stanza', async stanza => {
  
  if (stanza.attrs.id == 'step_03') {

    const hash = stanza.children[0].children[0].attrs.url.substring(29)
    const curlCommand = 'curl -X PUT -T "files/image.jpg" http://localhost:5280/upload/' + hash;

    let exec = require('child_process').exec;
    exec(curlCommand);

  }

})
 
xmpp.on('online', async address => {

  // send presence online for chat server
  await xmpp.send(xml('presence', {status: 'online'}))

  // send discovery by protocols options
  message = xml(
    'iq',
    {
      from: 'admin@localhost/' + resource,
      id: 'step_01',
      to:'localhost',
      type:'get'
    },
    xml(
      'query',
      {
        xmlns: 'http://jabber.org/protocol/disco#items'
      },
      ''
    )
  )

  await xmpp.send(message)

  // send specific discovery 
  message = xml(
    'iq',
    {
      from: 'admin@localhost/' + resource,
      id: 'step_02',
      to: 'localhost',
      type:'result'
    },
    xml(
      'query',
      {
        xmlns: 'http://jabber.org/protocol/disco#info'
      },
      [
        xml(
          'identity',
          {
            category: 'store',
            type: 'file',
            name: 'HTTP File Upload'
          }
        ),
        xml(
          'feature',
          {
            var:'urn:xmpp:http:upload:0'
          }
        ),
        xml(
          'x',
          {
            type: 'result',
            xmlns: 'jabber:x:data'
          },
          [
            xml(
              'field',
              {
                var: 'FORM_TYPE',
                type: 'hidden'
              },
              'urn:xmpp:http:upload:0'
            ),
            xml(
              'field',
              {
                var: 'max-file-size'
              },
              '52260' 
            )
          ]
        )
      ]
    )
  );

  await xmpp.send(message);

  // solicitation slot from server
  message = xml(
    'iq',
    {
      from: 'admin@localhost/' + resource,
      id: 'step_03',
      to: 'upload.localhost',
      type: 'get'
    },
    xml(
      'request',
      {
        xmlns: 'urn:xmpp:http:upload:0',
        filename: 'image.jpg',
        size: '52260',
        'content-type': 'image/jpeg'
      }
    )
  );

  await xmpp.send(message);

})
 
xmpp.start().catch(console.error);