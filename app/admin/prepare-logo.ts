export async function prepareLogo(file:File):Promise<Blob> {
  if (!["image/png","image/jpeg","image/webp"].includes(file.type) || file.size > 5*1024*1024)
    throw new Error("Elige un archivo PNG, JPG o WebP de hasta 5 MB.");
  const url=URL.createObjectURL(file);
  try {
    const image=new Image();
    image.src=url;
    await image.decode();
    const scale=Math.min(1,512/Math.max(image.naturalWidth,image.naturalHeight));
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
    canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const context=canvas.getContext("2d");
    if (!context) throw new Error("No se pudo preparar el logo.");
    context.drawImage(image,0,0,canvas.width,canvas.height);
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("No se pudo leer el logo.")),"image/png"));
  } finally { URL.revokeObjectURL(url); }
}
