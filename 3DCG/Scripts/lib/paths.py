"""3DCG ディレクトリ内の場所を1か所で定義する。

各スクリプトは絶対パスを直接書かず、ここを経由する。
リポジトリごと別の場所に置いても動くようにするため。
"""
import os

SCRIPTS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# アセット(.blend, テクスチャ, 参考資料)は公開リポジトリに置かず iCloud にある。
# 3Dモデルの無断利用・転売のリスクを避けるため、リポジトリにはスクリプトと
# ルールだけを置いている。環境変数 PORTFOLIO_3DCG で場所を差し替えられる。
DEFAULT_ROOT = os.path.expanduser(
    "~/Library/Mobile Documents/com~apple~CloudDocs/_MyDrive"
    "/_Projects/Development/Portfolio2025/3DCG"
)
ROOT = os.environ.get("PORTFOLIO_3DCG", DEFAULT_ROOT)

OBJECTS = os.path.join(ROOT, "Objects")
OUT = os.path.join(ROOT, "Out")
OUT_TMP = os.path.join(OUT, "Tmp")
TEXTURES = os.path.join(ROOT, "Textures")
REFERENCE = os.path.join(ROOT, "Reference")
TMP = os.path.join(ROOT, "Tmp")

SCENE = os.path.join(ROOT, "Portfolio2025-Room.blend")
AVATAR = os.path.join(OBJECTS, "Avatar", "Avatar.blend")


def obj(name):
    """Objects/<name>/<name>.blend を返す。"""
    return os.path.join(OBJECTS, name, name + ".blend")


def out(name):
    return os.path.join(OUT, name)


def out_tmp(*parts):
    p = os.path.join(OUT_TMP, *parts)
    os.makedirs(os.path.dirname(p) if os.path.splitext(p)[1] else p, exist_ok=True)
    return p
