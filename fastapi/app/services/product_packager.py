# app/services/product_packager.py
import json
import logging
import shutil
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..config import settings
from .r2_storage import upload_file

logger = logging.getLogger("digitallydefined.fastapi.product_packager")

OUT_DIR = settings.output_dir / "packages"
R2_PREFIX = "generated/packages/"


class ProductPackager:
    def __init__(self) -> None:
        OUT_DIR.mkdir(parents=True, exist_ok=True)

    def package(self, schema: dict[str, Any], stage: str = "Generic") -> dict[str, Any]:
        pid = f"{int(datetime.now().timestamp() * 1000)}-{stage.lower().replace(' ', '-')}"
        package = {
            "package_id": pid,
            "created_at": datetime.now(timezone.utc).isoformat() + "Z",
            "stage": stage,
            "schema": schema,
            "files": [],
            "gumroad_ready": True,
            "metadata": {"title": schema.get("title", "Untitled"), "version": "1.0.0"},
        }
        files, archive = self._write_files(package)
        package["files"] = files
        r2_key = f"{R2_PREFIX}{pid}.zip"
        try:
            upload_file(str(archive), r2_key, "application/zip")
            package["archive_r2_key"] = r2_key
            shutil.rmtree(OUT_DIR / pid, ignore_errors=True)
            try:
                archive.unlink(missing_ok=True)
            except Exception:
                pass
        except Exception as e:
            logger.warning("R2 upload failed, keeping local: %s", e)
            package["archive_path"] = str(archive)
        return package

    def _write_files(self, package):
        package_dir = OUT_DIR / package["package_id"]
        package_dir.mkdir(parents=True, exist_ok=True)
        schema_path = package_dir / "schema.json"
        schema_path.write_text(json.dumps(package["schema"], indent=2), encoding="utf-8")
        archive = OUT_DIR / f"{package['package_id']}.zip"
        with zipfile.ZipFile(archive, "w") as zf:
            zf.write(schema_path, arcname="schema.json")
        return [{"name": "schema.json", "size": schema_path.stat().st_size}], archive


packager = ProductPackager()