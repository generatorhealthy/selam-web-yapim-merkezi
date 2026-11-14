import {test,expect} from 'bun:test';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
test('patched form validator rejects missing fields and resolves valid data',async()=>{
 const resolver=zodResolver(z.object({title:z.string().min(2),content:z.string().min(2)}));
 const options={fields:{},shouldUseNativeValidation:false};
 const invalid=await resolver({title:'',content:''},{},options);
 expect(invalid.errors.title).toBeDefined();expect(invalid.errors.content).toBeDefined();
 const valid=await resolver({title:'Başlık',content:'İçerik'},{},options);
 expect(valid.errors).toEqual({});expect(valid.values.title).toBe('Başlık');
});