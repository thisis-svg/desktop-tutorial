// このファイルは Excel（特定保険医療材料 償還価格 2026年6月～）から自動生成。
// price は 2026年6月～の償還価格（円）。oldPrice は 2024年～の価格。

export type Category = 'abl' | 'pm' | 'common';

export type Material = {
  id: string;
  no: number;        // 材料番号
  product: string;   // 品名
  variant: string;   // 規格・型
  name: string;      // 表示名（品名＋規格）
  price: number;     // 償還価格（2026年6月～, 円）
  oldPrice: number | null;
  category: Category;
};

export const materials: Material[] = [
  { id: "m1_3", no: 1, product: "血管造影用シースイントロデューサーセット", variant: "(1)一般用 ① 標準型", name: "血管造影用シースイントロデューサーセット (1)一般用 ① 標準型", price: 2130, oldPrice: 2130, category: "common" },
  { id: "m1_4", no: 1, product: "血管造影用シースイントロデューサーセット", variant: "② 特殊型", name: "血管造影用シースイントロデューサーセット ② 特殊型", price: 2130, oldPrice: 2130, category: "common" },
  { id: "m1_5", no: 1, product: "血管造影用シースイントロデューサーセット", variant: "(2)蛇行血管用", name: "血管造影用シースイントロデューサーセット (2)蛇行血管用", price: 2680, oldPrice: 2700, category: "common" },
  { id: "m1_6", no: 1, product: "血管造影用シースイントロデューサーセット", variant: "(3)選択的導入用(ｶﾞｲﾃﾞｨﾝｸﾞｶﾃｰﾃﾙを兼ねるもの)", name: "血管造影用シースイントロデューサーセット (3)選択的導入用(ｶﾞｲﾃﾞｨﾝｸﾞｶﾃｰﾃﾙを兼ねるもの)", price: 18100, oldPrice: 13600, category: "common" },
  { id: "m1_7", no: 1, product: "血管造影用シースイントロデューサーセット", variant: "(5)遠位端可動型", name: "血管造影用シースイントロデューサーセット (5)遠位端可動型", price: 116000, oldPrice: 116000, category: "common" },
  { id: "m2_8", no: 2, product: "ダイレーター", variant: "", name: "ダイレーター", price: 2490, oldPrice: 2490, category: "common" },
  { id: "m12_9", no: 12, product: "血管造影用ガイドワイヤー", variant: "(1)交換用", name: "血管造影用ガイドワイヤー (1)交換用", price: 2090, oldPrice: 2090, category: "common" },
  { id: "m197_10", no: 197, product: "ガイドワイヤー", variant: "", name: "ガイドワイヤー", price: 2580, oldPrice: 1870, category: "common" },
  { id: "m107_11", no: 107, product: "経皮的血管形成術用穿刺部止血材料", variant: "", name: "経皮的血管形成術用穿刺部止血材料", price: 28400, oldPrice: 28400, category: "common" },
  { id: "m114_12", no: 114, product: "体外式ペースメーカー用カテーテル電極", variant: "(2)心臓電気生理学的検査機能付加型 ① 標準型", name: "体外式ペースメーカー用カテーテル電極 (2)心臓電気生理学的検査機能付加型 ① 標準型", price: 40500, oldPrice: 43100, category: "abl" },
  { id: "m114_13", no: 114, product: "体外式ペースメーカー用カテーテル電極", variant: "② 冠状静脈洞型", name: "体外式ペースメーカー用カテーテル電極 ② 冠状静脈洞型", price: 58700, oldPrice: 64000, category: "abl" },
  { id: "m114_14", no: 114, product: "体外式ペースメーカー用カテーテル電極", variant: "③房室弁輪部型", name: "体外式ペースメーカー用カテーテル電極 ③房室弁輪部型", price: 137000, oldPrice: 145000, category: "abl" },
  { id: "m114_15", no: 114, product: "体外式ペースメーカー用カテーテル電極", variant: "④心房内・心室内全域型", name: "体外式ペースメーカー用カテーテル電極 ④心房内・心室内全域型", price: 403000, oldPrice: 403000, category: "abl" },
  { id: "m114_16", no: 114, product: "体外式ペースメーカー用カテーテル電極", variant: "⑤温度センサー付き", name: "体外式ペースメーカー用カテーテル電極 ⑤温度センサー付き", price: 80000, oldPrice: 81700, category: "abl" },
  { id: "m114_17", no: 114, product: "体外式ペースメーカー用カテーテル電極", variant: "⑥除細動機能付き", name: "体外式ペースメーカー用カテーテル電極 ⑥除細動機能付き", price: 214000, oldPrice: 214000, category: "abl" },
  { id: "m114_18", no: 114, product: "体外式ペースメーカー用カテーテル電極", variant: "(3)再製造 ①冠状静脈洞型", name: "体外式ペースメーカー用カテーテル電極 (3)再製造 ①冠状静脈洞型", price: 44000, oldPrice: 51400, category: "abl" },
  { id: "m114_19", no: 114, product: "体外式ペースメーカー用カテーテル電極", variant: "②房室弁輪部型", name: "体外式ペースメーカー用カテーテル電極 ②房室弁輪部型", price: 89800, oldPrice: 93200, category: "abl" },
  { id: "m123_20", no: 123, product: "経皮的カテーテル心筋焼灼術用カテーテル", variant: "(1)熱アブレーション用 ①標準型", name: "経皮的カテーテル心筋焼灼術用カテーテル (1)熱アブレーション用 ①標準型", price: 105000, oldPrice: 112000, category: "abl" },
  { id: "m123_21", no: 123, product: "経皮的カテーテル心筋焼灼術用カテーテル", variant: "②イリゲーション型", name: "経皮的カテーテル心筋焼灼術用カテーテル ②イリゲーション型", price: 140000, oldPrice: 140000, category: "abl" },
  { id: "m123_22", no: 123, product: "経皮的カテーテル心筋焼灼術用カテーテル", variant: "③バルーン型", name: "経皮的カテーテル心筋焼灼術用カテーテル ③バルーン型", price: 505000, oldPrice: 505000, category: "abl" },
  { id: "m123_23", no: 123, product: "経皮的カテーテル心筋焼灼術用カテーテル", variant: "④体外式ペーシング機能付き", name: "経皮的カテーテル心筋焼灼術用カテーテル ④体外式ペーシング機能付き", price: 293000, oldPrice: 293000, category: "abl" },
  { id: "m123_24", no: 123, product: "経皮的カテーテル心筋焼灼術用カテーテル", variant: "⑤体外式ペーシング機能付き・特殊型", name: "経皮的カテーテル心筋焼灼術用カテーテル ⑤体外式ペーシング機能付き・特殊型", price: 395000, oldPrice: 395000, category: "abl" },
  { id: "m123_25", no: 123, product: "経皮的カテーテル心筋焼灼術用カテーテル", variant: "⑥体外式ペーシング機能付き・組織表面温度測定型", name: "経皮的カテーテル心筋焼灼術用カテーテル ⑥体外式ペーシング機能付き・組織表面温度測定型", price: 310000, oldPrice: 310000, category: "abl" },
  { id: "m123_26", no: 123, product: "経皮的カテーテル心筋焼灼術用カテーテル", variant: "(2)冷凍アブレーション用 ①バルーン型", name: "経皮的カテーテル心筋焼灼術用カテーテル (2)冷凍アブレーション用 ①バルーン型", price: 649000, oldPrice: 649000, category: "abl" },
  { id: "m123_27", no: 123, product: "経皮的カテーテル心筋焼灼術用カテーテル", variant: "②標準型", name: "経皮的カテーテル心筋焼灼術用カテーテル ②標準型", price: 138000, oldPrice: 140000, category: "abl" },
  { id: "m123_28", no: 123, product: "経皮的カテーテル心筋焼灼術用カテーテル", variant: "(3)パルスフィールドアブレーション用 ①標準型", name: "経皮的カテーテル心筋焼灼術用カテーテル (3)パルスフィールドアブレーション用 ①標準型", price: 681000, oldPrice: 681000, category: "abl" },
  { id: "m123_29", no: 123, product: "経皮的カテーテル心筋焼灼術用カテーテル", variant: "②熱アブレーション機能・心臓電気生理学的検査機能 (心房内・心室内全域型)付加型)", name: "経皮的カテーテル心筋焼灼術用カテーテル ②熱アブレーション機能・心臓電気生理学的検査機能 (心房内・心室内全域型)付加型)", price: 883000, oldPrice: 883000, category: "abl" },
  { id: "m168_30", no: 168, product: "心腔内超音波プローブ", variant: "(1)標準型", name: "心腔内超音波プローブ (1)標準型", price: 299000, oldPrice: 299000, category: "abl" },
  { id: "m168_31", no: 168, product: "心腔内超音波プローブ", variant: "(2)磁気センサー付き", name: "心腔内超音波プローブ (2)磁気センサー付き", price: 327000, oldPrice: 327000, category: "abl" },
  { id: "m168_32", no: 168, product: "心腔内超音波プローブ", variant: "(3)再製造 ①標準型", name: "心腔内超音波プローブ (3)再製造 ①標準型", price: 205000, oldPrice: 209000, category: "abl" },
  { id: "m168_33", no: 168, product: "心腔内超音波プローブ", variant: "②磁気センサー付き", name: "心腔内超音波プローブ ②磁気センサー付き", price: 229000, oldPrice: 229000, category: "abl" },
  { id: "m177_34", no: 177, product: "心房中隔穿刺針", variant: "(1)高周波型 ①標準型", name: "心房中隔穿刺針 (1)高周波型 ①標準型", price: 54100, oldPrice: 54100, category: "abl" },
  { id: "m177_35", no: 177, product: "心房中隔穿刺針", variant: "②特殊型", name: "心房中隔穿刺針 ②特殊型", price: 60900, oldPrice: 60900, category: "abl" },
  { id: "m177_36", no: 177, product: "心房中隔穿刺針", variant: "(2)ガイドワイヤー型", name: "心房中隔穿刺針 (2)ガイドワイヤー型", price: 35400, oldPrice: 35400, category: "abl" },
  { id: "m177_37", no: 177, product: "心房中隔穿刺針", variant: "(3)カニューレ", name: "心房中隔穿刺針 (3)カニューレ", price: 2760, oldPrice: 2760, category: "abl" },
  { id: "m112_38", no: 112, product: "ペースメーカー", variant: "(1)シングルチャンバ ①標準型", name: "ペースメーカー (1)シングルチャンバ ①標準型", price: 388000, oldPrice: 391000, category: "pm" },
  { id: "m112_39", no: 112, product: "ペースメーカー", variant: "②リード一体型", name: "ペースメーカー ②リード一体型", price: 1060000, oldPrice: 1060000, category: "pm" },
  { id: "m112_40", no: 112, product: "ペースメーカー", variant: "(2)デュアルチャンバ(Ⅳ型)", name: "ペースメーカー (2)デュアルチャンバ(Ⅳ型)", price: 507000, oldPrice: 516000, category: "pm" },
  { id: "m112_41", no: 112, product: "ペースメーカー", variant: "(3)デュアルチャンバ(Ⅴ型)", name: "ペースメーカー (3)デュアルチャンバ(Ⅴ型)", price: 722000, oldPrice: 730000, category: "pm" },
  { id: "m112_42", no: 112, product: "ペースメーカー", variant: "(4)デュアルチャンバ(リード一体型)", name: "ペースメーカー (4)デュアルチャンバ(リード一体型)", price: 1070000, oldPrice: 1070000, category: "pm" },
  { id: "m112_43", no: 112, product: "ペースメーカー", variant: "(5)トリプルチャンバ(１型)", name: "ペースメーカー (5)トリプルチャンバ(１型)", price: 1260000, oldPrice: 1260000, category: "pm" },
  { id: "m112_44", no: 112, product: "ペースメーカー", variant: "(6)トリプルチャンバ(Ⅱ型) ①単極用又は双極用", name: "ペースメーカー (6)トリプルチャンバ(Ⅱ型) ①単極用又は双極用", price: 1350000, oldPrice: 1350000, category: "pm" },
  { id: "m112_45", no: 112, product: "ペースメーカー", variant: "②４極用", name: "ペースメーカー ②４極用", price: 1380000, oldPrice: 1400000, category: "pm" },
  { id: "m112_46", no: 112, product: "ペースメーカー", variant: "(7)トリプルチャンバ(Ⅲ型) ①自動調整機能付き", name: "ペースメーカー (7)トリプルチャンバ(Ⅲ型) ①自動調整機能付き", price: 1640000, oldPrice: 1640000, category: "pm" },
  { id: "m112_47", no: 112, product: "ペースメーカー", variant: "②４極用・自動調整機能付き", name: "ペースメーカー ②４極用・自動調整機能付き", price: 1710000, oldPrice: 1710000, category: "pm" },
  { id: "m113_48", no: 113, product: "植込式心臓ペースメーカー用リード", variant: "(1)リード ①経静脈リード ア 標準型", name: "植込式心臓ペースメーカー用リード (1)リード ①経静脈リード ア 標準型", price: 67500, oldPrice: 71100, category: "pm" },
  { id: "m113_49", no: 113, product: "植込式心臓ペースメーカー用リード", variant: "①経静脈リード イ シングルパスVDDリード", name: "植込式心臓ペースメーカー用リード ①経静脈リード イ シングルパスVDDリード", price: 106000, oldPrice: 106000, category: "pm" },
  { id: "m113_50", no: 113, product: "植込式心臓ペースメーカー用リード", variant: "①経静脈リード ウ 誤感知防止型", name: "植込式心臓ペースメーカー用リード ①経静脈リード ウ 誤感知防止型", price: 126000, oldPrice: 126000, category: "pm" },
  { id: "m113_51", no: 113, product: "植込式心臓ペースメーカー用リード", variant: "①経静脈リード エ ４型", name: "植込式心臓ペースメーカー用リード ①経静脈リード エ ４型", price: 129000, oldPrice: 130000, category: "pm" },
  { id: "m113_52", no: 113, product: "植込式心臓ペースメーカー用リード", variant: "①経静脈リード オ 特殊型", name: "植込式心臓ペースメーカー用リード ①経静脈リード オ 特殊型", price: 77000, oldPrice: null, category: "pm" },
  { id: "m113_53", no: 113, product: "植込式心臓ペースメーカー用リード", variant: "②心筋用リード ア 単極", name: "植込式心臓ペースメーカー用リード ②心筋用リード ア 単極", price: 81700, oldPrice: 81700, category: "pm" },
  { id: "m113_54", no: 113, product: "植込式心臓ペースメーカー用リード", variant: "②心筋用リード イ 双極", name: "植込式心臓ペースメーカー用リード ②心筋用リード イ 双極", price: 90600, oldPrice: 95500, category: "pm" },
  { id: "m113_55", no: 113, product: "植込式心臓ペースメーカー用リード", variant: "(2)アダプター", name: "植込式心臓ペースメーカー用リード (2)アダプター", price: 26400, oldPrice: 26400, category: "pm" },
  { id: "m113_56", no: 113, product: "植込式心臓ペースメーカー用リード", variant: "(3)アクセサリー", name: "植込式心臓ペースメーカー用リード (3)アクセサリー", price: 3010, oldPrice: 3200, category: "pm" },
  { id: "m117_57", no: 117, product: "植込型除細動器", variant: "(1)植込型除細動器(Ⅲ型) ①標準型", name: "植込型除細動器 (1)植込型除細動器(Ⅲ型) ①標準型", price: 2580000, oldPrice: 2580000, category: "pm" },
  { id: "m117_58", no: 117, product: "植込型除細動器", variant: "②皮下植込式電極併用型", name: "植込型除細動器 ②皮下植込式電極併用型", price: 3120000, oldPrice: 3120000, category: "pm" },
  { id: "m117_59", no: 117, product: "植込型除細動器", variant: "③胸骨下植込式電極併用型", name: "植込型除細動器 ③胸骨下植込式電極併用型", price: 3560000, oldPrice: null, category: "pm" },
  { id: "m117_60", no: 117, product: "植込型除細動器", variant: "(2)植込型除細動器(Ⅴ型)", name: "植込型除細動器 (2)植込型除細動器(Ⅴ型)", price: 2660000, oldPrice: 2660000, category: "pm" },
  { id: "m118_61", no: 118, product: "植込型除細動器用カテーテル電極", variant: "(1)植込型除細動器用カテーテル電極(シングル)", name: "植込型除細動器用カテーテル電極 (1)植込型除細動器用カテーテル電極(シングル)", price: 538000, oldPrice: 538000, category: "pm" },
  { id: "m118_62", no: 118, product: "植込型除細動器用カテーテル電極", variant: "(2)植込型除細動器用カテーテル電極(マルチ(一式))", name: "植込型除細動器用カテーテル電極 (2)植込型除細動器用カテーテル電極(マルチ(一式))", price: 199000, oldPrice: 199000, category: "pm" },
  { id: "m118_63", no: 118, product: "植込型除細動器用カテーテル電極", variant: "(3)アダプター", name: "植込型除細動器用カテーテル電極 (3)アダプター", price: 268000, oldPrice: 268000, category: "pm" },
  { id: "m118_64", no: 118, product: "植込型除細動器用カテーテル電極", variant: "(4)植込型除細動器用カテーテル電極(皮下植込式)", name: "植込型除細動器用カテーテル電極 (4)植込型除細動器用カテーテル電極(皮下植込式)", price: 602000, oldPrice: 602000, category: "pm" },
  { id: "m118_65", no: 118, product: "植込型除細動器用カテーテル電極", variant: "(5)植込型除細動器用カテーテル電極(胸骨下植込式)", name: "植込型除細動器用カテーテル電極 (5)植込型除細動器用カテーテル電極(胸骨下植込式)", price: 650000, oldPrice: 659000, category: "pm" },
  { id: "m144_66", no: 144, product: "両室ペーシング機能付き植込み型除細動器", variant: "(1)単極又は双極用 ①標準型", name: "両室ペーシング機能付き植込み型除細動器 (1)単極又は双極用 ①標準型", price: 3090000, oldPrice: 3090000, category: "pm" },
  { id: "m144_67", no: 144, product: "両室ペーシング機能付き植込み型除細動器", variant: "②自動調整機能付き", name: "両室ペーシング機能付き植込み型除細動器 ②自動調整機能付き", price: 3130000, oldPrice: 3130000, category: "pm" },
  { id: "m144_68", no: 144, product: "両室ペーシング機能付き植込み型除細動器", variant: "③抗頻拍ペーシング機能付き", name: "両室ペーシング機能付き植込み型除細動器 ③抗頻拍ペーシング機能付き", price: 4350000, oldPrice: 4400000, category: "pm" },
  { id: "m144_69", no: 144, product: "両室ペーシング機能付き植込み型除細動器", variant: "④長期留置型", name: "両室ペーシング機能付き植込み型除細動器 ④長期留置型", price: 3460000, oldPrice: 3720000, category: "pm" },
  { id: "m144_70", no: 144, product: "両室ペーシング機能付き植込み型除細動器", variant: "(2)4極用 ①標準型", name: "両室ペーシング機能付き植込み型除細動器 (2)4極用 ①標準型", price: 3260000, oldPrice: 3260000, category: "pm" },
  { id: "m144_71", no: 144, product: "両室ペーシング機能付き植込み型除細動器", variant: "②自動調整機能付き", name: "両室ペーシング機能付き植込み型除細動器 ②自動調整機能付き", price: 4090000, oldPrice: 4120000, category: "pm" },
  { id: "m144_72", no: 144, product: "両室ペーシング機能付き植込み型除細動器", variant: "③抗頻拍ペーシング機能付き", name: "両室ペーシング機能付き植込み型除細動器 ③抗頻拍ペーシング機能付き", price: 4750000, oldPrice: 4750000, category: "pm" },
  { id: "m144_73", no: 144, product: "両室ペーシング機能付き植込み型除細動器", variant: "④長期留置型", name: "両室ペーシング機能付き植込み型除細動器 ④長期留置型", price: 4130000, oldPrice: 4180000, category: "pm" },
  { id: "m155_74", no: 155, product: "植込型心電図記録計", variant: "", name: "植込型心電図記録計", price: 388000, oldPrice: 388000, category: "pm" },
];
