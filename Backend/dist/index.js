"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const groq_sdk_1 = __importDefault(require("groq-sdk"));
// Load environment variables first
dotenv_1.default.config();
const groq = new groq_sdk_1.default({
    apiKey: process.env.GROQ_API_KEY,
});
function runChat() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        var _d, _e;
        // Create a streaming chat completion
        const chatStream = yield groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                { role: "user", content: "make a TODO application" }
            ],
            temperature: 1,
            max_completion_tokens: 8192,
            top_p: 1,
            stream: true, // important for streaming
            reasoning_effort: "medium",
        });
        console.log("Streaming response:\n");
        try {
            // Loop over chunks as they arrive
            for (var _f = true, chatStream_1 = __asyncValues(chatStream), chatStream_1_1; chatStream_1_1 = yield chatStream_1.next(), _a = chatStream_1_1.done, !_a; _f = true) {
                _c = chatStream_1_1.value;
                _f = false;
                const chunk = _c;
                const text = (_e = (_d = chunk.choices[0]) === null || _d === void 0 ? void 0 : _d.delta) === null || _e === void 0 ? void 0 : _e.content;
                if (text) {
                    // Output text immediately
                    process.stdout.write(text);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_f && !_a && (_b = chatStream_1.return)) yield _b.call(chatStream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        console.log("\n\n✅ Stream finished!");
    });
}
// Run the async function
runChat().catch(console.error);
