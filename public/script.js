var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var uploadBtn = document.getElementById("uploadBtn");
var fileInput = document.getElementById("fileInput");
var resultsF = document.getElementById("results");
uploadBtn.addEventListener("click", function (e) { return __awaiter(_this, void 0, void 0, function () {
    var file, formData, response, errorText, result, err_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                e.preventDefault();
                file = (_a = fileInput.files) === null || _a === void 0 ? void 0 : _a[0];
                if (!file) {
                    alert("No file selected");
                    return [2 /*return*/];
                }
                console.log("File selected:", file);
                formData = new FormData();
                formData.append("file", file);
                _b.label = 1;
            case 1:
                _b.trys.push([1, 6, , 7]);
                return [4 /*yield*/, fetch("http://localhost:3000/upload", {
                        method: "POST",
                        body: formData,
                    })];
            case 2:
                response = _b.sent();
                if (!!response.ok) return [3 /*break*/, 4];
                return [4 /*yield*/, response.text()];
            case 3:
                errorText = _b.sent();
                resultsF.textContent = "Error ".concat(response.status, ": ").concat(errorText);
                return [2 /*return*/];
            case 4: return [4 /*yield*/, response.json()];
            case 5:
                result = _b.sent();
                console.log("Frontend got result:", result);
                resultsF.textContent = JSON.stringify(result, null, 2);
                return [3 /*break*/, 7];
            case 6:
                err_1 = _b.sent();
                console.error("Upload failed:", err_1);
                resultsF.textContent = "Upload failed: ".concat(err_1.message);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
fileInput.addEventListener("change", function () {
    var _a;
    console.log("File Was Selected!");
    console.log(fileInput.files);
    console.log((_a = fileInput.files) === null || _a === void 0 ? void 0 : _a[0]);
});
