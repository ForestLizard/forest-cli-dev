const long = require('long')

var tsProtoGlobalThis = (() => {
    if (typeof globalThis !== "undefined") {
      return globalThis;
    }
    if (typeof self !== "undefined") {
      return self;
    }
    if (typeof window !== "undefined") {
      return window;
    }
    if (typeof global !== "undefined") {
      return global;
    }
    throw "Unable to locate global object";
  })();

  function base64FromBytes(arr) {
    if (tsProtoGlobalThis.Buffer) {
      return tsProtoGlobalThis.Buffer.from(arr).toString("base64");
    } else {
      const bin = [];
      arr.forEach((byte) => {
        bin.push(String.fromCharCode(byte));
      });
      return tsProtoGlobalThis.btoa(bin.join(""));
    }
  }

const toJSON = message => {
    const obj = {};
    message.timestamp !== undefined && (obj.timestamp = (message.timestamp || Long.ZERO).toString());
    message.msg_type !== undefined && (obj.msg_type = 1);
    message.union?.$case === "u_U32" && (obj.u_U32 = Math.round(message.union?.u_U32));
    message.union?.$case === "U_u64" && (obj.U_u64 = (message.union?.U_u64 || undefined).toString());
    message.union?.$case === "r" && (obj.r = message.union?.r ? pingresp.toJSON(message.union?.r) : undefined);
    obj.m = {};
    if (message.m) {
      message.m.forEach((v, k) => {
        obj.m[k] = Math.round(v);
      });
    }
    message.rr !== undefined && (obj.rr = message.rr ? pingresp.toJSON(message.rr) : undefined);
    message.b !== undefined && (obj.b = base64FromBytes(message.b !== undefined ? message.b : new Uint8Array()));
    return obj;
}

const test = () => {
    const map = new Map()
    map.set(1671781151289, 100)
    const test = {
        timestamp: 1671781151289,
        msg_type: 1,
        union: { $case: "u_U32", u_U32: 11111 },
        m: map,
        b: new Uint8Array(5)
    }
    console.log(JSON.stringify(toJSON(test)))
}

test()